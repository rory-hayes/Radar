import "server-only";

import { serverEnv } from "@/lib/env/server";
import { buildRadarEmailTemplate } from "@/lib/notifications/email-templates";
import { notificationEmailRequestSchema, type NotificationEmailRequest } from "@/lib/notifications/schema";
import { createNotificationDelivery, updateNotificationDeliveryStatus, type RadarRepositoryClient } from "@/lib/repositories";
import { sendResendEmail, type ResendEmailResult } from "@/lib/notifications/resend";

export type SendWorkspaceNotificationInput = NotificationEmailRequest & {
  workspaceId: string;
  workspaceName: string;
};

export type WorkspaceNotificationSendResult = {
  recipientEmail: string;
  deliveryId: string;
  status: ResendEmailResult["status"];
  providerMessageId?: string;
  error?: string;
};

type SendWorkspaceNotificationOptions = {
  fromEmail?: string;
  appUrl?: string;
  resendApiKey?: string;
  fetcher?: typeof fetch;
};

export async function sendWorkspaceNotificationEmails(
  client: RadarRepositoryClient,
  input: SendWorkspaceNotificationInput,
  options: SendWorkspaceNotificationOptions = {},
): Promise<WorkspaceNotificationSendResult[]> {
  const parsedInput = {
    ...notificationEmailRequestSchema.parse(input),
    workspaceId: input.workspaceId,
    workspaceName: input.workspaceName,
  };
  const appUrl = options.appUrl ?? serverEnv.RADAR_APP_URL;
  const preferencesUrl = parsedInput.preferencesUrl ?? notificationPreferencesUrl(appUrl);
  const unsubscribeUrl = parsedInput.unsubscribeUrl ?? notificationPreferencesUrl(appUrl);
  const template = buildRadarEmailTemplate({
    notificationType: parsedInput.notificationType,
    payload: {
      ...parsedInput.payload,
      workspaceName: parsedInput.payload.workspaceName ?? parsedInput.workspaceName,
    },
    preferencesUrl,
    unsubscribeUrl,
  });

  const uniqueRecipients = [...new Set(parsedInput.recipients.map((recipient) => recipient.toLowerCase()))];
  const results: WorkspaceNotificationSendResult[] = [];

  for (const recipientEmail of uniqueRecipients) {
    const delivery = await createNotificationDelivery(client, {
      workspaceId: parsedInput.workspaceId,
      notificationType: parsedInput.notificationType,
      recipientEmail,
      subject: template.subject,
      resourceType: template.resourceType,
      resourceId: template.resourceId,
      preferencesUrl,
      unsubscribeUrl,
      metadata: {
        notificationVersion: "rad-087",
        payloadKeys: Object.keys(parsedInput.payload).sort(),
      },
    });
    const sendResult = await sendResendEmail(
      {
        from: options.fromEmail ?? serverEnv.RESEND_FROM_EMAIL ?? "",
        to: [recipientEmail],
        subject: template.subject,
        html: template.html,
        text: template.text,
        tags: [
          { name: "workspace_id", value: parsedInput.workspaceId },
          { name: "notification_type", value: parsedInput.notificationType },
        ],
      },
      {
        apiKey: options.resendApiKey,
        fetcher: options.fetcher,
      },
    );
    const updatedDelivery = await updateNotificationDeliveryStatus(
      client,
      parsedInput.workspaceId,
      delivery.id,
      statusUpdateForSendResult(sendResult),
    );

    results.push({
      recipientEmail,
      deliveryId: updatedDelivery.id,
      status: sendResult.status,
      providerMessageId: sendResult.status === "sent" ? sendResult.providerMessageId : undefined,
      error: sendResult.status === "failed" ? sendResult.error : sendResult.status === "skipped" ? sendResult.reason : undefined,
    });
  }

  return results;
}

function statusUpdateForSendResult(result: ResendEmailResult) {
  if (result.status === "sent") {
    return {
      status: "sent" as const,
      providerMessageId: result.providerMessageId,
      sentAt: new Date().toISOString(),
    };
  }

  if (result.status === "skipped") {
    return {
      status: "skipped" as const,
      errorMessage: result.reason,
    };
  }

  return {
    status: "failed" as const,
    errorMessage: result.error,
  };
}

function notificationPreferencesUrl(appUrl?: string) {
  if (!appUrl) {
    return undefined;
  }

  return `${appUrl.replace(/\/$/, "")}/settings?section=notifications`;
}

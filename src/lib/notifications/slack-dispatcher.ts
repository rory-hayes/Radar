import "server-only";

import { buildSlackAlertTemplate } from "@/lib/notifications/slack-templates";
import { sendSlackWebhookAlert, type SlackWebhookResult } from "@/lib/notifications/slack";
import { slackAlertRequestSchema, type SlackAlertRequest } from "@/lib/notifications/schema";
import { createNotificationDelivery, updateNotificationDeliveryStatus, type RadarRepositoryClient } from "@/lib/repositories";

export type SendWorkspaceSlackAlertInput = SlackAlertRequest & {
  workspaceId: string;
  workspaceName: string;
};

export type WorkspaceSlackAlertResult = {
  deliveryId: string;
  status: SlackWebhookResult["status"];
  providerMessageId?: string;
  error?: string;
};

type SendWorkspaceSlackAlertOptions = {
  webhookUrl?: string;
  fetcher?: typeof fetch;
};

export async function sendWorkspaceSlackAlert(
  client: RadarRepositoryClient,
  input: SendWorkspaceSlackAlertInput,
  options: SendWorkspaceSlackAlertOptions = {},
): Promise<WorkspaceSlackAlertResult> {
  const parsedInput = {
    ...slackAlertRequestSchema.parse(input),
    workspaceId: input.workspaceId,
    workspaceName: input.workspaceName,
  };
  const template = buildSlackAlertTemplate({
    alertType: parsedInput.alertType,
    payload: {
      ...parsedInput.payload,
      workspaceName: parsedInput.payload.workspaceName ?? parsedInput.workspaceName,
    },
  });
  const delivery = await createNotificationDelivery(client, {
    workspaceId: parsedInput.workspaceId,
    channel: "slack",
    notificationType: parsedInput.alertType,
    recipientLabel: "Slack incoming webhook",
    subject: template.subject,
    provider: "slack_webhook",
    resourceType: template.resourceType,
    resourceId: template.resourceId,
    metadata: {
      notificationVersion: "rad-088",
      payloadKeys: Object.keys(parsedInput.payload).sort(),
    },
  });
  const sendResult = await sendSlackWebhookAlert(
    {
      text: template.text,
      blocks: template.blocks,
    },
    {
      webhookUrl: options.webhookUrl,
      fetcher: options.fetcher,
    },
  );
  const updatedDelivery = await updateNotificationDeliveryStatus(
    client,
    parsedInput.workspaceId,
    delivery.id,
    statusUpdateForSlackResult(sendResult),
  );

  return {
    deliveryId: updatedDelivery.id,
    status: sendResult.status,
    providerMessageId: sendResult.status === "sent" ? sendResult.providerMessageId : undefined,
    error: sendResult.status === "failed" ? sendResult.error : sendResult.status === "skipped" ? sendResult.reason : undefined,
  };
}

function statusUpdateForSlackResult(result: SlackWebhookResult) {
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

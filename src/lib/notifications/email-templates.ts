import "server-only";

import { notificationPayloadSchema, type NotificationDeliveryType, type RadarNotificationPayload } from "@/lib/notifications/schema";

export type RadarEmailTemplateInput = {
  notificationType: NotificationDeliveryType;
  payload: RadarNotificationPayload;
  preferencesUrl?: string;
  unsubscribeUrl?: string;
};

export type RadarEmailTemplate = {
  subject: string;
  text: string;
  html: string;
  resourceType?: string;
  resourceId?: string;
};

export function buildRadarEmailTemplate(input: RadarEmailTemplateInput): RadarEmailTemplate {
  const payload = notificationPayloadSchema.parse(input.payload);

  if (input.notificationType === "critical_finding") {
    return composeTemplate({
      subject: `Radar critical finding: ${payload.findingTitle ?? "Review required"}`,
      heading: "Critical finding needs attention",
      body: [
        `${payload.findingTitle ?? "A critical finding"} was detected${payload.workspaceName ? ` in ${payload.workspaceName}` : ""}.`,
        payload.summary ?? payload.errorMessage ?? "Review the evidence-backed finding and recommended fix in Radar.",
      ],
      actionLabel: "Review finding",
      actionUrl: payload.actionUrl,
      preferencesUrl: input.preferencesUrl,
      unsubscribeUrl: input.unsubscribeUrl,
      resourceType: "finding",
      resourceId: payload.findingId,
    });
  }

  if (input.notificationType === "weekly_report_available") {
    return composeTemplate({
      subject: `Radar weekly trust report ready${payload.workspaceName ? ` for ${payload.workspaceName}` : ""}`,
      heading: "Weekly trust report ready",
      body: [
        payload.summary ?? "Your weekly trust report is ready with checks run, pass rate, exceptions, risky categories, and next actions.",
      ],
      actionLabel: "Open report",
      actionUrl: payload.reportUrl ?? payload.actionUrl,
      preferencesUrl: input.preferencesUrl,
      unsubscribeUrl: input.unsubscribeUrl,
      resourceType: "report",
    });
  }

  if (input.notificationType === "source_sync_failed") {
    return composeTemplate({
      subject: `Radar source sync failed: ${payload.sourceName ?? "Source needs attention"}`,
      heading: "Source sync failed",
      body: [
        `${payload.sourceName ?? "A source"} could not be synced${payload.workspaceName ? ` in ${payload.workspaceName}` : ""}.`,
        payload.errorMessage ?? payload.summary ?? "Review the source configuration and retry the sync after correcting the issue.",
      ],
      actionLabel: "Review source",
      actionUrl: payload.actionUrl,
      preferencesUrl: input.preferencesUrl,
      unsubscribeUrl: input.unsubscribeUrl,
      resourceType: "source",
      resourceId: payload.sourceId,
    });
  }

  return composeTemplate({
    subject: `You were invited to ${payload.workspaceName ?? "Radar"}`,
    heading: "Workspace invitation",
    body: [
      `${payload.inviterEmail ?? "A workspace admin"} invited you to ${payload.workspaceName ?? "a Radar workspace"}.`,
      payload.summary ?? "Accept the invitation to start reviewing assertions, findings, sources, and trust reports.",
    ],
    actionLabel: "Accept invite",
    actionUrl: payload.inviteUrl ?? payload.actionUrl,
    preferencesUrl: input.preferencesUrl,
    unsubscribeUrl: input.unsubscribeUrl,
    resourceType: "workspace_invite",
  });
}

function composeTemplate(input: {
  subject: string;
  heading: string;
  body: string[];
  actionLabel: string;
  actionUrl?: string;
  preferencesUrl?: string;
  unsubscribeUrl?: string;
  resourceType?: string;
  resourceId?: string;
}): RadarEmailTemplate {
  const body = input.body.filter((line) => line.trim().length > 0);
  const footerLines = [
    input.preferencesUrl ? `Manage notification preferences: ${input.preferencesUrl}` : undefined,
    input.unsubscribeUrl ? `Unsubscribe or adjust email notifications: ${input.unsubscribeUrl}` : undefined,
  ].filter(isPresent);
  const text = [
    input.heading,
    "",
    ...body,
    input.actionUrl ? "" : undefined,
    input.actionUrl ? `${input.actionLabel}: ${input.actionUrl}` : undefined,
    footerLines.length > 0 ? "" : undefined,
    ...footerLines,
  ].filter(isPresent).join("\n");
  const htmlBody = body.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
  const actionHtml = input.actionUrl
    ? `<p><a href="${escapeAttribute(input.actionUrl)}">${escapeHtml(input.actionLabel)}</a></p>`
    : "";
  const footerHtml = footerLines.length > 0
    ? `<hr><p>${footerLines.map(escapeHtml).join("<br>")}</p>`
    : "";

  return {
    subject: input.subject,
    text,
    html: `<main><h1>${escapeHtml(input.heading)}</h1>${htmlBody}${actionHtml}${footerHtml}</main>`,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
  };
}

function isPresent(value: string | undefined): value is string {
  return Boolean(value && value.trim().length > 0);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

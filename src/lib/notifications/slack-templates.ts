import "server-only";

import { notificationPayloadSchema, type RadarNotificationPayload, type SlackAlertType } from "@/lib/notifications/schema";

export type SlackAlertTemplateInput = {
  alertType: SlackAlertType;
  payload: RadarNotificationPayload;
};

export type SlackBlock = {
  type: "header" | "section" | "divider";
  text?: {
    type: "plain_text" | "mrkdwn";
    text: string;
  };
};

export type SlackAlertTemplate = {
  subject: string;
  text: string;
  blocks: SlackBlock[];
  resourceType?: string;
  resourceId?: string;
};

export function buildSlackAlertTemplate(input: SlackAlertTemplateInput): SlackAlertTemplate {
  const payload = notificationPayloadSchema.parse(input.payload);

  if (input.alertType === "critical_finding") {
    const title = payload.findingTitle ?? "Critical finding needs attention";
    const workspace = payload.workspaceName ? ` in ${payload.workspaceName}` : "";
    const summary = payload.summary ?? payload.errorMessage ?? "Review the evidence-backed finding and recommended fix in Radar.";
    const action = payload.actionUrl ? `\n<${payload.actionUrl}|Review finding>` : "";

    return {
      subject: `Radar critical finding: ${title}`,
      text: `Radar critical finding${workspace}: ${title}. ${summary}`,
      blocks: [
        header("Critical finding needs attention"),
        section(`*${escapeSlackText(title)}*${workspace}`),
        section(`${escapeSlackText(summary)}${action}`),
      ],
      resourceType: "finding",
      resourceId: payload.findingId,
    };
  }

  const passRate = typeof payload.passRate === "number" ? `${Math.round(payload.passRate * 100)}% pass rate` : undefined;
  const counts = [
    typeof payload.runCount === "number" ? `${payload.runCount} checks run` : undefined,
    typeof payload.criticalFindingCount === "number" ? `${payload.criticalFindingCount} critical` : undefined,
    typeof payload.warningFindingCount === "number" ? `${payload.warningFindingCount} warnings` : undefined,
  ].filter(isPresent).join(" | ");
  const summary = payload.summary ?? "Daily Radar summary is ready.";
  const action = (payload.reportUrl ?? payload.actionUrl) ? `\n<${payload.reportUrl ?? payload.actionUrl}|Open Radar>` : "";

  return {
    subject: `Radar daily summary${payload.workspaceName ? ` for ${payload.workspaceName}` : ""}`,
    text: [summary, passRate, counts].filter(isPresent).join(" "),
    blocks: [
      header("Daily Radar summary"),
      section(`*${escapeSlackText(payload.workspaceName ?? "Workspace")}*`),
      section([escapeSlackText(summary), passRate, counts, action].filter(isPresent).join("\n")),
    ],
    resourceType: "daily_summary",
  };
}

function header(text: string): SlackBlock {
  return {
    type: "header",
    text: {
      type: "plain_text",
      text,
    },
  };
}

function section(text: string): SlackBlock {
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text,
    },
  };
}

function isPresent(value: string | undefined): value is string {
  return Boolean(value && value.trim().length > 0);
}

function escapeSlackText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

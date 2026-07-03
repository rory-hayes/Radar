import { z } from "zod";

export const notificationDeliveryTypes = [
  "critical_finding",
  "weekly_report_available",
  "source_sync_failed",
  "workspace_invite",
  "daily_summary",
] as const;

export const emailNotificationTypes = [
  "critical_finding",
  "weekly_report_available",
  "source_sync_failed",
  "workspace_invite",
] as const;

export const slackAlertTypes = ["critical_finding", "daily_summary"] as const;
export const notificationChannels = ["email", "slack"] as const;
export const notificationDeliveryStatuses = ["queued", "sent", "skipped", "failed"] as const;

export type NotificationDeliveryType = (typeof notificationDeliveryTypes)[number];
export type EmailNotificationType = (typeof emailNotificationTypes)[number];
export type SlackAlertType = (typeof slackAlertTypes)[number];
export type NotificationChannel = (typeof notificationChannels)[number];
export type NotificationDeliveryStatus = (typeof notificationDeliveryStatuses)[number];

export type RadarNotificationPayload = {
  workspaceName?: string;
  findingId?: string;
  findingTitle?: string;
  findingSeverity?: string;
  sourceId?: string;
  sourceName?: string;
  reportUrl?: string;
  inviteUrl?: string;
  inviterEmail?: string;
  summary?: string;
  actionUrl?: string;
  errorMessage?: string;
  passRate?: number;
  criticalFindingCount?: number;
  warningFindingCount?: number;
  runCount?: number;
};

export type RadarNotificationDelivery = {
  id: string;
  workspaceId: string;
  channel: NotificationChannel;
  notificationType: NotificationDeliveryType;
  recipientEmail?: string;
  recipientLabel?: string;
  subject: string;
  status: NotificationDeliveryStatus;
  provider: "resend" | "slack_webhook";
  providerMessageId?: string;
  errorMessage?: string;
  resourceType?: string;
  resourceId?: string;
  preferencesUrl?: string;
  unsubscribeUrl?: string;
  metadata: Record<string, unknown>;
  sentAt?: string;
  createdAt: string;
};

export const notificationPayloadSchema = z.object({
  workspaceName: z.string().trim().min(1).max(120).optional(),
  findingId: z.uuid().optional(),
  findingTitle: z.string().trim().min(1).max(180).optional(),
  findingSeverity: z.string().trim().min(1).max(40).optional(),
  sourceId: z.uuid().optional(),
  sourceName: z.string().trim().min(1).max(140).optional(),
  reportUrl: z.url().optional(),
  inviteUrl: z.url().optional(),
  inviterEmail: z.email().optional(),
  summary: z.string().trim().min(1).max(1000).optional(),
  actionUrl: z.url().optional(),
  errorMessage: z.string().trim().min(1).max(1000).optional(),
  passRate: z.number().min(0).max(1).optional(),
  criticalFindingCount: z.number().int().min(0).max(100000).optional(),
  warningFindingCount: z.number().int().min(0).max(100000).optional(),
  runCount: z.number().int().min(0).max(100000).optional(),
});

export const notificationEmailRequestSchema = z.object({
  notificationType: z.enum(emailNotificationTypes),
  recipients: z.array(z.email().max(320)).min(1).max(20),
  payload: notificationPayloadSchema,
  preferencesUrl: z.url().optional(),
  unsubscribeUrl: z.url().optional(),
});

export const slackAlertRequestSchema = z.object({
  alertType: z.enum(slackAlertTypes),
  payload: notificationPayloadSchema,
});

export const notificationDeliveryCreateSchema = z.object({
  workspaceId: z.uuid(),
  channel: z.enum(notificationChannels).default("email"),
  notificationType: z.enum(notificationDeliveryTypes),
  recipientEmail: z.email().max(320).optional(),
  recipientLabel: z.string().trim().min(2).max(120).optional(),
  subject: z.string().trim().min(4).max(200),
  provider: z.enum(["resend", "slack_webhook"]).default("resend"),
  resourceType: z.string().trim().min(1).max(80).optional(),
  resourceId: z.uuid().optional(),
  preferencesUrl: z.url().optional(),
  unsubscribeUrl: z.url().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
}).superRefine((input, ctx) => {
  if (input.channel === "email" && !input.recipientEmail) {
    ctx.addIssue({
      code: "custom",
      path: ["recipientEmail"],
      message: "Email deliveries require a recipient email.",
    });
  }

  if (input.channel === "slack" && !input.recipientLabel) {
    ctx.addIssue({
      code: "custom",
      path: ["recipientLabel"],
      message: "Slack deliveries require a recipient label.",
    });
  }
});

export const notificationDeliveryStatusUpdateSchema = z.object({
  status: z.enum(notificationDeliveryStatuses),
  providerMessageId: z.string().trim().min(1).max(200).optional(),
  errorMessage: z.string().trim().min(1).max(1000).optional(),
  sentAt: z.iso.datetime().optional(),
});

export type NotificationEmailRequest = z.infer<typeof notificationEmailRequestSchema>;
export type SlackAlertRequest = z.infer<typeof slackAlertRequestSchema>;
export type NotificationDeliveryCreateInput = z.infer<typeof notificationDeliveryCreateSchema>;
export type NotificationDeliveryStatusUpdateInput = z.infer<typeof notificationDeliveryStatusUpdateSchema>;

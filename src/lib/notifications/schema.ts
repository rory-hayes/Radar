import { z } from "zod";

export const notificationDeliveryTypes = [
  "critical_finding",
  "weekly_report_available",
  "source_sync_failed",
  "workspace_invite",
] as const;

export const notificationDeliveryStatuses = ["queued", "sent", "skipped", "failed"] as const;

export type NotificationDeliveryType = (typeof notificationDeliveryTypes)[number];
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
};

export type RadarNotificationDelivery = {
  id: string;
  workspaceId: string;
  notificationType: NotificationDeliveryType;
  recipientEmail: string;
  subject: string;
  status: NotificationDeliveryStatus;
  provider: "resend";
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
});

export const notificationEmailRequestSchema = z.object({
  notificationType: z.enum(notificationDeliveryTypes),
  recipients: z.array(z.email().max(320)).min(1).max(20),
  payload: notificationPayloadSchema,
  preferencesUrl: z.url().optional(),
  unsubscribeUrl: z.url().optional(),
});

export const notificationDeliveryCreateSchema = z.object({
  workspaceId: z.uuid(),
  notificationType: z.enum(notificationDeliveryTypes),
  recipientEmail: z.email().max(320),
  subject: z.string().trim().min(4).max(200),
  resourceType: z.string().trim().min(1).max(80).optional(),
  resourceId: z.uuid().optional(),
  preferencesUrl: z.url().optional(),
  unsubscribeUrl: z.url().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const notificationDeliveryStatusUpdateSchema = z.object({
  status: z.enum(notificationDeliveryStatuses),
  providerMessageId: z.string().trim().min(1).max(200).optional(),
  errorMessage: z.string().trim().min(1).max(1000).optional(),
  sentAt: z.iso.datetime().optional(),
});

export type NotificationEmailRequest = z.infer<typeof notificationEmailRequestSchema>;
export type NotificationDeliveryCreateInput = z.infer<typeof notificationDeliveryCreateSchema>;
export type NotificationDeliveryStatusUpdateInput = z.infer<typeof notificationDeliveryStatusUpdateSchema>;

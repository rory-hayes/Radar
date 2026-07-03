import "server-only";

import {
  notificationDeliveryCreateSchema,
  notificationDeliveryStatusUpdateSchema,
  type NotificationDeliveryCreateInput,
  type NotificationChannel,
  type NotificationDeliveryStatus,
  type NotificationDeliveryStatusUpdateInput,
  type NotificationDeliveryType,
  type RadarNotificationDelivery,
} from "@/lib/notifications/schema";
import {
  assertRepositorySuccess,
  jsonRecord,
  optionalString,
  requireRepositoryRow,
  type JsonRecord,
  type RadarRepositoryClient,
} from "@/lib/repositories/client";

type NotificationDeliveryRow = {
  id: string;
  workspace_id: string;
  channel: NotificationChannel;
  notification_type: NotificationDeliveryType;
  recipient_email: string | null;
  recipient_label: string | null;
  subject: string;
  status: NotificationDeliveryStatus;
  provider: "resend" | "slack_webhook";
  provider_message_id: string | null;
  error_message: string | null;
  resource_type: string | null;
  resource_id: string | null;
  preferences_url: string | null;
  unsubscribe_url: string | null;
  metadata: JsonRecord;
  sent_at: string | null;
  created_at: string;
};

const notificationDeliverySelect =
  "id, workspace_id, channel, notification_type, recipient_email, recipient_label, subject, status, provider, provider_message_id, error_message, resource_type, resource_id, preferences_url, unsubscribe_url, metadata, sent_at, created_at";

export async function createNotificationDelivery(
  client: RadarRepositoryClient,
  input: NotificationDeliveryCreateInput,
) {
  const parsedInput = notificationDeliveryCreateSchema.parse(input);
  const { data, error } = await client
    .from("notification_deliveries")
    .insert({
      workspace_id: parsedInput.workspaceId,
      channel: parsedInput.channel,
      notification_type: parsedInput.notificationType,
      recipient_email: parsedInput.recipientEmail ?? null,
      recipient_label: parsedInput.recipientLabel ?? null,
      subject: parsedInput.subject,
      provider: parsedInput.provider,
      resource_type: parsedInput.resourceType ?? null,
      resource_id: parsedInput.resourceId ?? null,
      preferences_url: parsedInput.preferencesUrl ?? null,
      unsubscribe_url: parsedInput.unsubscribeUrl ?? null,
      metadata: parsedInput.metadata,
    })
    .select(notificationDeliverySelect)
    .single<NotificationDeliveryRow>();

  assertRepositorySuccess(error, "Unable to create notification delivery");
  return mapNotificationDeliveryRow(requireRepositoryRow(data, "Notification delivery insert returned no row"));
}

export async function updateNotificationDeliveryStatus(
  client: RadarRepositoryClient,
  workspaceId: string,
  deliveryId: string,
  input: NotificationDeliveryStatusUpdateInput,
) {
  const parsedInput = notificationDeliveryStatusUpdateSchema.parse(input);
  const { data, error } = await client
    .from("notification_deliveries")
    .update({
      status: parsedInput.status,
      provider_message_id: parsedInput.providerMessageId ?? null,
      error_message: parsedInput.errorMessage ?? null,
      sent_at: parsedInput.sentAt ?? null,
    })
    .eq("workspace_id", workspaceId)
    .eq("id", deliveryId)
    .select(notificationDeliverySelect)
    .single<NotificationDeliveryRow>();

  assertRepositorySuccess(error, "Unable to update notification delivery");
  return mapNotificationDeliveryRow(requireRepositoryRow(data, "Notification delivery update returned no row"));
}

export async function listNotificationDeliveries(
  client: RadarRepositoryClient,
  workspaceId: string,
  options: { limit?: number } = {},
) {
  const { data, error } = await client
    .from("notification_deliveries")
    .select(notificationDeliverySelect)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 50)
    .returns<NotificationDeliveryRow[]>();

  assertRepositorySuccess(error, "Unable to list notification deliveries");
  return (data ?? []).map(mapNotificationDeliveryRow);
}

function mapNotificationDeliveryRow(row: NotificationDeliveryRow): RadarNotificationDelivery {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    channel: row.channel,
    notificationType: row.notification_type,
    recipientEmail: optionalString(row.recipient_email),
    recipientLabel: optionalString(row.recipient_label),
    subject: row.subject,
    status: row.status,
    provider: row.provider,
    providerMessageId: optionalString(row.provider_message_id),
    errorMessage: optionalString(row.error_message),
    resourceType: optionalString(row.resource_type),
    resourceId: optionalString(row.resource_id),
    preferencesUrl: optionalString(row.preferences_url),
    unsubscribeUrl: optionalString(row.unsubscribe_url),
    metadata: jsonRecord(row.metadata),
    sentAt: optionalString(row.sent_at),
    createdAt: row.created_at,
  };
}

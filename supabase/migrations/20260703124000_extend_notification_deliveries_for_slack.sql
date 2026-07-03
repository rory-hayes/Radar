alter type public.notification_delivery_type add value if not exists 'daily_summary';

alter table public.notification_deliveries
drop constraint notification_deliveries_channel_check;

alter table public.notification_deliveries
alter column recipient_email drop not null;

alter table public.notification_deliveries
add column recipient_label text;

alter table public.notification_deliveries
add constraint notification_deliveries_channel_check check (channel in ('email', 'slack'));

alter table public.notification_deliveries
add constraint notification_deliveries_recipient_label_length check (
  recipient_label is null or char_length(trim(recipient_label)) between 2 and 120
);

alter table public.notification_deliveries
add constraint notification_deliveries_channel_recipient_check check (
  (channel = 'email' and recipient_email is not null)
  or
  (channel = 'slack' and recipient_label is not null)
);

create index notification_deliveries_workspace_channel_idx
on public.notification_deliveries(workspace_id, channel, created_at desc);

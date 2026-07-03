create type public.notification_delivery_type as enum (
  'critical_finding',
  'weekly_report_available',
  'source_sync_failed',
  'workspace_invite'
);

create type public.notification_delivery_status as enum (
  'queued',
  'sent',
  'skipped',
  'failed'
);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  notification_type public.notification_delivery_type not null,
  channel text not null default 'email',
  recipient_email text not null,
  subject text not null,
  status public.notification_delivery_status not null default 'queued',
  provider text not null default 'resend',
  provider_message_id text,
  error_message text,
  resource_type text,
  resource_id uuid,
  preferences_url text,
  unsubscribe_url text,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_deliveries_channel_check check (channel = 'email'),
  constraint notification_deliveries_recipient_email_length check (char_length(trim(recipient_email)) between 3 and 320),
  constraint notification_deliveries_subject_length check (char_length(trim(subject)) between 4 and 200),
  constraint notification_deliveries_provider_length check (char_length(trim(provider)) between 2 and 40),
  constraint notification_deliveries_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index notification_deliveries_workspace_created_at_idx on public.notification_deliveries(workspace_id, created_at desc);
create index notification_deliveries_workspace_status_idx on public.notification_deliveries(workspace_id, status, created_at desc);
create index notification_deliveries_workspace_type_idx on public.notification_deliveries(workspace_id, notification_type, created_at desc);

create trigger notification_deliveries_set_updated_at
before update on public.notification_deliveries
for each row execute function public.set_updated_at();

alter table public.notification_deliveries enable row level security;
alter table public.notification_deliveries force row level security;

create policy "workspace members can read notification deliveries"
on public.notification_deliveries
for select
to authenticated
using (public.current_user_is_workspace_member(notification_deliveries.workspace_id));

create policy "workspace managers can create notification deliveries"
on public.notification_deliveries
for insert
to authenticated
with check (public.current_user_can_edit_workspace(notification_deliveries.workspace_id));

create policy "workspace managers can update notification deliveries"
on public.notification_deliveries
for update
to authenticated
using (public.current_user_can_edit_workspace(notification_deliveries.workspace_id))
with check (public.current_user_can_edit_workspace(notification_deliveries.workspace_id));

create type public.abuse_limit_event_type as enum (
  'source_sync',
  'eval_run',
  'ai_call',
  'api_request',
  'file_upload',
  'runner_execution'
);

create table public.abuse_limit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event_type public.abuse_limit_event_type not null,
  quantity integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint abuse_limit_events_quantity_positive check (quantity between 1 and 1000),
  constraint abuse_limit_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index abuse_limit_events_workspace_type_time_idx
on public.abuse_limit_events(workspace_id, event_type, occurred_at desc);

create index abuse_limit_events_user_type_time_idx
on public.abuse_limit_events(user_id, event_type, occurred_at desc)
where user_id is not null;

alter table public.abuse_limit_events enable row level security;
alter table public.abuse_limit_events force row level security;

create policy "abuse_limit_events_select_workspace_members"
on public.abuse_limit_events
for select
using (public.current_user_is_workspace_member(abuse_limit_events.workspace_id));

create policy "abuse_limit_events_insert_workspace_members"
on public.abuse_limit_events
for insert
with check (
  public.current_user_is_workspace_member(abuse_limit_events.workspace_id)
  and (abuse_limit_events.user_id is null or abuse_limit_events.user_id = auth.uid())
);

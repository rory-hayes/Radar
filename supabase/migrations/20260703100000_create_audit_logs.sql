create type public.audit_action as enum (
  'auth.signed_in',
  'auth.signed_out',
  'workspace.created',
  'workspace.updated',
  'workspace.member_added',
  'workspace.member_updated',
  'source.created',
  'source.updated',
  'source.deleted',
  'assertion.created',
  'assertion.updated',
  'assertion.deleted',
  'run.rerun_requested',
  'finding.resolved',
  'finding.updated'
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action public.audit_action not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_resource_type_format check (resource_type ~ '^[a-z][a-z0-9_]*$'),
  constraint audit_logs_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index audit_logs_workspace_created_at_idx on public.audit_logs(workspace_id, created_at desc);
create index audit_logs_actor_created_at_idx on public.audit_logs(actor_user_id, created_at desc);
create index audit_logs_action_created_at_idx on public.audit_logs(action, created_at desc);

alter table public.audit_logs enable row level security;

create policy "workspace members can read workspace audit logs"
on public.audit_logs
for select
to authenticated
using (
  workspace_id is not null
  and exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = audit_logs.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

create policy "actors can read their own auth audit logs"
on public.audit_logs
for select
to authenticated
using (
  workspace_id is null
  and actor_user_id = auth.uid()
);

create policy "authenticated users can write scoped audit logs"
on public.audit_logs
for insert
to authenticated
with check (
  actor_user_id = auth.uid()
  and (
    workspace_id is null
    or exists (
      select 1
      from public.workspace_members membership
      where membership.workspace_id = audit_logs.workspace_id
        and membership.user_id = auth.uid()
        and membership.status = 'active'
    )
  )
);

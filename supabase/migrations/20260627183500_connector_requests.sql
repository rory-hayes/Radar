create table if not exists public.radar_connector_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null references public.radar_workspaces(id) on delete cascade,
  connector_type text not null check (connector_type in ('google_drive', 'confluence_jira', 'notion', 'support_crm', 'other')),
  display_name text not null,
  source_location text,
  status text not null default 'requested' check (status in ('requested', 'scoping', 'ready_to_wire', 'connected', 'blocked')),
  requested_by_email text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists radar_connector_requests_workspace_created_idx
  on public.radar_connector_requests(workspace_id, created_at desc);

alter table public.radar_connector_requests enable row level security;

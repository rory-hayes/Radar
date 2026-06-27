create table if not exists public.radar_workspaces (
  id text primary key,
  name text not null,
  onboarding_state text not null default 'admin_setup',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.radar_workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null references public.radar_workspaces(id) on delete cascade,
  email text not null,
  name text,
  role text not null check (role in ('owner', 'admin', 'knowledge_manager', 'approver', 'analyst', 'user', 'viewer')),
  status text not null default 'active' check (status in ('active', 'invited', 'disabled')),
  onboarding_state text not null default 'setup_required',
  invited_by_email text,
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, email)
);

create unique index if not exists radar_workspace_members_email_idx
  on public.radar_workspace_members(workspace_id, lower(email));

create table if not exists public.radar_workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null references public.radar_workspaces(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'knowledge_manager', 'approver', 'analyst', 'user', 'viewer')),
  status text not null default 'pending' check (status in ('pending', 'sent', 'accepted', 'revoked', 'expired')),
  invited_by_email text not null,
  supabase_user_id uuid,
  sent_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists radar_workspace_invites_email_idx
  on public.radar_workspace_invites(workspace_id, lower(email), status);

create table if not exists public.radar_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null references public.radar_workspaces(id) on delete cascade,
  created_by_email text not null,
  status text not null check (status in ('active', 'paused', 'ended')),
  tab jsonb,
  capture jsonb not null,
  consent jsonb not null,
  client jsonb,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists radar_sessions_workspace_created_idx
  on public.radar_sessions(workspace_id, created_at desc);

create table if not exists public.radar_transcript_segments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.radar_sessions(id) on delete cascade,
  text text not null,
  source text not null check (source in ('microphone', 'active_tab', 'manual')),
  is_final boolean not null default true,
  started_at_ms integer,
  ended_at_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists radar_transcript_segments_session_idx
  on public.radar_transcript_segments(session_id, created_at);

create table if not exists public.radar_guidance_cards (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.radar_sessions(id) on delete cascade,
  lane text not null check (lane in ('answer', 'proof', 'ask', 'needs_confirmation', 'escalate')),
  title text not null,
  body text not null,
  citations jsonb not null default '[]'::jsonb,
  is_local_test boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists radar_guidance_cards_session_idx
  on public.radar_guidance_cards(session_id, created_at);

create table if not exists public.radar_card_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.radar_sessions(id) on delete cascade,
  card_id uuid not null references public.radar_guidance_cards(id) on delete cascade,
  rating text not null check (rating in ('helpful', 'not_helpful', 'incorrect', 'unsafe')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists radar_card_feedback_session_idx
  on public.radar_card_feedback(session_id, created_at);

create table if not exists public.radar_session_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.radar_sessions(id) on delete cascade,
  sequence integer not null,
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique(session_id, sequence)
);

create index if not exists radar_session_events_session_sequence_idx
  on public.radar_session_events(session_id, sequence);

create table if not exists public.radar_audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null references public.radar_workspaces(id) on delete cascade,
  actor_email text not null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists radar_audit_events_workspace_created_idx
  on public.radar_audit_events(workspace_id, created_at desc);

alter table public.radar_workspaces enable row level security;
alter table public.radar_workspace_members enable row level security;
alter table public.radar_workspace_invites enable row level security;
alter table public.radar_sessions enable row level security;
alter table public.radar_transcript_segments enable row level security;
alter table public.radar_guidance_cards enable row level security;
alter table public.radar_card_feedback enable row level security;
alter table public.radar_session_events enable row level security;
alter table public.radar_audit_events enable row level security;

insert into public.radar_workspaces(id, name)
values ('radar', 'Radar')
on conflict (id) do nothing;

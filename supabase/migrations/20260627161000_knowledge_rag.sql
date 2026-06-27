create extension if not exists vector with schema extensions;

create table if not exists public.radar_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null references public.radar_workspaces(id) on delete cascade,
  title text not null,
  source_type text not null check (source_type in ('document', 'playbook', 'policy', 'faq', 'note')),
  uri text,
  status text not null default 'processing' check (status in ('processing', 'approved', 'rejected', 'archived', 'failed')),
  owner_email text,
  uploaded_by_email text not null,
  approved_by_email text,
  approved_at timestamptz,
  chunk_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists radar_sources_workspace_status_idx
  on public.radar_sources(workspace_id, status, updated_at desc);

create table if not exists public.radar_uploads (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null references public.radar_workspaces(id) on delete cascade,
  source_id uuid references public.radar_sources(id) on delete cascade,
  file_name text,
  content_type text,
  byte_size integer,
  status text not null default 'processing' check (status in ('processing', 'processed', 'failed')),
  uploaded_by_email text not null,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists radar_uploads_workspace_created_idx
  on public.radar_uploads(workspace_id, created_at desc);

create table if not exists public.radar_source_chunks (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null references public.radar_workspaces(id) on delete cascade,
  source_id uuid not null references public.radar_sources(id) on delete cascade,
  upload_id uuid references public.radar_uploads(id) on delete set null,
  chunk_index integer not null,
  content text not null,
  token_count integer,
  embedding extensions.vector(1536) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(source_id, chunk_index)
);

create index if not exists radar_source_chunks_source_idx
  on public.radar_source_chunks(source_id, chunk_index);

create index if not exists radar_source_chunks_embedding_idx
  on public.radar_source_chunks
  using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 100);

create table if not exists public.radar_retrieval_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null references public.radar_workspaces(id) on delete cascade,
  session_id uuid references public.radar_sessions(id) on delete cascade,
  transcript_segment_id uuid references public.radar_transcript_segments(id) on delete cascade,
  query text not null,
  match_count integer not null default 0,
  top_similarity double precision,
  created_at timestamptz not null default now()
);

create index if not exists radar_retrieval_events_workspace_created_idx
  on public.radar_retrieval_events(workspace_id, created_at desc);

create or replace function public.match_radar_source_chunks(
  match_workspace_id text,
  query_embedding extensions.vector(1536),
  match_count integer default 5
)
returns table (
  chunk_id uuid,
  source_id uuid,
  source_title text,
  source_type text,
  source_uri text,
  chunk_index integer,
  content text,
  similarity double precision,
  created_at timestamptz
)
language sql
stable
set search_path = public, extensions
as $$
  select
    chunk.id as chunk_id,
    source.id as source_id,
    source.title as source_title,
    source.source_type as source_type,
    source.uri as source_uri,
    chunk.chunk_index as chunk_index,
    chunk.content as content,
    1 - (chunk.embedding <=> query_embedding) as similarity,
    chunk.created_at as created_at
  from public.radar_source_chunks as chunk
  join public.radar_sources as source
    on source.id = chunk.source_id
  where chunk.workspace_id = match_workspace_id
    and source.workspace_id = match_workspace_id
    and source.status = 'approved'
  order by chunk.embedding <=> query_embedding
  limit least(greatest(match_count, 1), 20)
$$;

alter table public.radar_sources enable row level security;
alter table public.radar_uploads enable row level security;
alter table public.radar_source_chunks enable row level security;
alter table public.radar_retrieval_events enable row level security;

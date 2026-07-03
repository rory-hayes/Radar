create extension if not exists vector with schema extensions;

create type public.source_type as enum (
  'url',
  'uploaded_document',
  'manual_text',
  'api_endpoint',
  'support_bot_endpoint'
);

create type public.source_sync_status as enum (
  'draft',
  'ready',
  'syncing',
  'synced',
  'error',
  'paused',
  'archived'
);

create type public.source_document_status as enum (
  'pending',
  'extracting',
  'ready',
  'error',
  'archived'
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  type public.source_type not null,
  sync_status public.source_sync_status not null default 'draft',
  origin_uri text,
  config jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  content_hash text,
  last_synced_at timestamptz,
  last_sync_error text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sources_name_length check (char_length(trim(name)) between 2 and 140),
  constraint sources_description_length check (description is null or char_length(description) <= 500),
  constraint sources_config_object check (jsonb_typeof(config) = 'object'),
  constraint sources_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint sources_hash_length check (content_hash is null or char_length(content_hash) between 16 and 128)
);

create table public.source_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete cascade,
  version_number integer not null,
  sync_status public.source_sync_status not null default 'syncing',
  content_hash text not null,
  document_count integer not null default 0,
  chunk_count integer not null default 0,
  sync_started_at timestamptz,
  sync_completed_at timestamptz,
  sync_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint source_versions_version_positive check (version_number > 0),
  constraint source_versions_counts_non_negative check (document_count >= 0 and chunk_count >= 0),
  constraint source_versions_hash_length check (char_length(content_hash) between 16 and 128),
  constraint source_versions_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint source_versions_workspace_source_unique unique (workspace_id, source_id, version_number),
  constraint source_versions_source_hash_unique unique (source_id, content_hash)
);

create table public.source_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete cascade,
  source_version_id uuid not null references public.source_versions(id) on delete cascade,
  title text not null,
  document_uri text,
  mime_type text,
  storage_path text,
  status public.source_document_status not null default 'pending',
  content_hash text not null,
  byte_size bigint,
  extracted_at timestamptz,
  extraction_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint source_documents_title_length check (char_length(trim(title)) between 2 and 180),
  constraint source_documents_hash_length check (char_length(content_hash) between 16 and 128),
  constraint source_documents_byte_size_non_negative check (byte_size is null or byte_size >= 0),
  constraint source_documents_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint source_documents_version_hash_unique unique (source_version_id, content_hash)
);

create table public.source_chunks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete cascade,
  source_document_id uuid not null references public.source_documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  content_hash text not null,
  token_count integer,
  embedding extensions.vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint source_chunks_index_non_negative check (chunk_index >= 0),
  constraint source_chunks_content_not_empty check (char_length(trim(content)) > 0),
  constraint source_chunks_hash_length check (char_length(content_hash) between 16 and 128),
  constraint source_chunks_token_count_positive check (token_count is null or token_count > 0),
  constraint source_chunks_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint source_chunks_document_index_unique unique (source_document_id, chunk_index)
);

create index sources_workspace_status_idx on public.sources(workspace_id, sync_status);
create index sources_workspace_type_idx on public.sources(workspace_id, type);
create index sources_created_by_idx on public.sources(created_by);
create index source_versions_workspace_source_idx on public.source_versions(workspace_id, source_id, version_number desc);
create index source_documents_workspace_source_idx on public.source_documents(workspace_id, source_id, created_at desc);
create index source_documents_version_idx on public.source_documents(source_version_id);
create index source_chunks_workspace_source_idx on public.source_chunks(workspace_id, source_id);
create index source_chunks_document_idx on public.source_chunks(source_document_id, chunk_index);

create trigger sources_set_updated_at
before update on public.sources
for each row execute function public.set_updated_at();

create trigger source_versions_set_updated_at
before update on public.source_versions
for each row execute function public.set_updated_at();

create trigger source_documents_set_updated_at
before update on public.source_documents
for each row execute function public.set_updated_at();

alter table public.sources enable row level security;
alter table public.source_versions enable row level security;
alter table public.source_documents enable row level security;
alter table public.source_chunks enable row level security;

create policy "workspace members can read sources"
on public.sources
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = sources.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

create policy "workspace editors can create sources"
on public.sources
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = sources.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
);

create policy "workspace editors can update sources"
on public.sources
for update
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = sources.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = sources.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
);

create policy "workspace editors can delete sources"
on public.sources
for delete
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = sources.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
);

create policy "workspace members can read source versions"
on public.source_versions
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = source_versions.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

create policy "workspace editors can manage source versions"
on public.source_versions
for all
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = source_versions.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = source_versions.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
);

create policy "workspace members can read source documents"
on public.source_documents
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = source_documents.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

create policy "workspace editors can manage source documents"
on public.source_documents
for all
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = source_documents.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = source_documents.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
);

create policy "workspace members can read source chunks"
on public.source_chunks
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = source_chunks.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

create policy "workspace editors can manage source chunks"
on public.source_chunks
for all
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = source_chunks.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = source_chunks.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
);

create type public.assertion_source_relationship_type as enum (
  'manual',
  'auto_generated'
);

alter table public.assertion_sources
add column relationship_type public.assertion_source_relationship_type not null default 'manual',
add column metadata jsonb not null default '{}'::jsonb;

alter table public.assertion_sources
add constraint assertion_sources_metadata_object check (jsonb_typeof(metadata) = 'object');

create index assertion_sources_workspace_relationship_idx
on public.assertion_sources(workspace_id, relationship_type, source_id);

create or replace function public.match_assertion_source_chunks(
  p_workspace_id uuid,
  p_assertion_id uuid,
  p_query_embedding extensions.vector(1536),
  p_match_count integer default 8,
  p_source_ids uuid[] default null
)
returns table (
  chunk_id uuid,
  source_id uuid,
  source_name text,
  source_type public.source_type,
  source_document_id uuid,
  document_title text,
  document_uri text,
  storage_path text,
  chunk_index integer,
  content text,
  content_hash text,
  token_count integer,
  similarity double precision
)
language sql
stable
set search_path = public, extensions
as $$
  select
    chunk.id as chunk_id,
    chunk.source_id,
    source.name as source_name,
    source.type as source_type,
    document.id as source_document_id,
    document.title as document_title,
    document.document_uri,
    document.storage_path,
    chunk.chunk_index,
    chunk.content,
    chunk.content_hash,
    chunk.token_count,
    1 - (chunk.embedding <=> p_query_embedding) as similarity
  from public.source_chunks as chunk
  join public.source_documents as document
    on document.workspace_id = chunk.workspace_id
   and document.id = chunk.source_document_id
  join public.sources as source
    on source.workspace_id = chunk.workspace_id
   and source.id = chunk.source_id
  join public.assertion_sources as assertion_source
    on assertion_source.workspace_id = chunk.workspace_id
   and assertion_source.source_id = chunk.source_id
   and assertion_source.assertion_id = p_assertion_id
  where chunk.workspace_id = p_workspace_id
    and chunk.embedding is not null
    and (p_source_ids is null or chunk.source_id = any(p_source_ids))
  order by chunk.embedding <=> p_query_embedding asc, chunk.chunk_index asc
  limit least(greatest(coalesce(p_match_count, 8), 1), 20);
$$;

comment on function public.match_assertion_source_chunks(uuid, uuid, extensions.vector, integer, uuid[])
is 'Returns ranked source chunks for a workspace assertion using only assertion-linked sources.';

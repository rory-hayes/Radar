import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function fileExists(relativePath) {
  await access(relativePath);
  return true;
}

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-021 creates source, version, document, and chunk tables", async () => {
  const migration = await readWorkspaceFile("supabase/migrations/20260703103000_create_sources_documents_chunks.sql");

  assert.match(migration, /create extension if not exists vector/);
  assert.match(migration, /create type public\.source_type as enum/);
  assert.match(migration, /'url'/);
  assert.match(migration, /'uploaded_document'/);
  assert.match(migration, /'manual_text'/);
  assert.match(migration, /'api_endpoint'/);
  assert.match(migration, /'support_bot_endpoint'/);
  assert.match(migration, /create table public\.sources/);
  assert.match(migration, /create table public\.source_versions/);
  assert.match(migration, /create table public\.source_documents/);
  assert.match(migration, /create table public\.source_chunks/);
  assert.match(migration, /embedding extensions\.vector\(1536\)/);
});

test("RAD-021 keeps source evidence workspace-owned, versioned, and hashable", async () => {
  const migration = await readWorkspaceFile("supabase/migrations/20260703103000_create_sources_documents_chunks.sql");

  for (const table of ["sources", "source_versions", "source_documents", "source_chunks"]) {
    assert.match(migration, new RegExp(`create table public\\.${table}[\\s\\S]*?workspace_id uuid not null references public\\.workspaces`));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }

  assert.match(migration, /content_hash text/);
  assert.match(migration, /metadata jsonb not null default '\{\}'::jsonb/);
  assert.match(migration, /constraint source_versions_workspace_source_unique unique \(workspace_id, source_id, version_number\)/);
  assert.match(migration, /constraint source_documents_version_hash_unique unique \(source_version_id, content_hash\)/);
  assert.match(migration, /constraint source_chunks_document_index_unique unique \(source_document_id, chunk_index\)/);
  assert.match(migration, /source_chunks_content_not_empty/);
});

test("RAD-021 enforces source RLS for members and editor mutations", async () => {
  const migration = await readWorkspaceFile("supabase/migrations/20260703103000_create_sources_documents_chunks.sql");

  assert.match(migration, /workspace members can read sources/);
  assert.match(migration, /workspace editors can create sources/);
  assert.match(migration, /workspace editors can update sources/);
  assert.match(migration, /workspace editors can delete sources/);
  assert.match(migration, /workspace members can read source versions/);
  assert.match(migration, /workspace editors can manage source versions/);
  assert.match(migration, /workspace members can read source documents/);
  assert.match(migration, /workspace editors can manage source documents/);
  assert.match(migration, /workspace members can read source chunks/);
  assert.match(migration, /workspace editors can manage source chunks/);
  assert.match(migration, /membership\.role in \('admin', 'editor'\)/);
});

test("RAD-021 adds typed source validation schemas", async () => {
  await fileExists("src/lib/sources/schema.ts");

  const schema = await readWorkspaceFile("src/lib/sources/schema.ts");

  assert.match(schema, /sourceTypes = \["url", "uploaded_document", "manual_text", "api_endpoint", "support_bot_endpoint"\]/);
  assert.match(schema, /sourceSyncStatuses = \["draft", "ready", "syncing", "synced", "error", "paused", "archived"\]/);
  assert.match(schema, /sourceDocumentStatuses = \["pending", "extracting", "ready", "error", "archived"\]/);
  assert.match(schema, /createSourceSchema/);
  assert.match(schema, /sourceVersionSchema/);
  assert.match(schema, /sourceDocumentSchema/);
  assert.match(schema, /sourceChunkSchema/);
  assert.match(schema, /RadarSourceChunk/);
});

test("RAD-021 documents source data boundaries", async () => {
  const dataModel = await readWorkspaceFile("docs/DATA_MODEL.md");
  const security = await readWorkspaceFile("docs/SECURITY.md");

  assert.match(dataModel, /Sources and Evidence Input/);
  assert.match(dataModel, /source_versions/);
  assert.match(dataModel, /source_chunks/);
  assert.match(dataModel, /workspace_id/);
  assert.match(security, /Source Data Isolation/);
  assert.match(security, /restricts source mutations to active Admin or Editor members/);
  assert.match(security, /never in audit metadata/);
});

import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = "supabase/migrations/20260703112000_configure_evidence_artifact_storage.sql";

async function fileExists(relativePath) {
  await access(relativePath);
  return true;
}

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-028 creates a private evidence artifacts storage bucket", async () => {
  await fileExists(migrationPath);

  const migration = await readWorkspaceFile(migrationPath);

  assert.match(migration, /insert into storage\.buckets/);
  assert.match(migration, /'radar-evidence-artifacts'/);
  assert.match(migration, /public,\s*file_size_limit,\s*allowed_mime_types/);
  assert.match(migration, /false,\s*52428800/);
  assert.match(migration, /'application\/pdf'/);
  assert.match(migration, /'image\/png'/);
  assert.match(migration, /'text\/plain'/);
  assert.match(migration, /on conflict \(id\) do update/);
  assert.match(migration, /public = false/);
});

test("RAD-028 adds storage artifact validation schemas", async () => {
  const schemas = await readWorkspaceFile("src/lib/validation/schemas.ts");

  assert.match(schemas, /evidenceArtifactKinds = \[/);
  assert.match(schemas, /"uploaded-document"/);
  assert.match(schemas, /"source-snapshot"/);
  assert.match(schemas, /"screenshot"/);
  assert.match(schemas, /"run-artifact"/);
  assert.match(schemas, /"report-export"/);
  assert.match(schemas, /evidenceArtifactPathRequestSchema/);
  assert.match(schemas, /evidenceArtifactSignedUrlRequestSchema/);
  assert.match(schemas, /evidenceArtifactUploadUrlResponseSchema/);
  assert.match(schemas, /evidenceArtifactDownloadUrlResponseSchema/);
});

test("RAD-028 adds server-only evidence artifact access helpers", async () => {
  await fileExists("src/lib/storage/evidence-artifacts.ts");
  await fileExists("src/lib/storage/index.ts");

  const helper = await readWorkspaceFile("src/lib/storage/evidence-artifacts.ts");
  const index = await readWorkspaceFile("src/lib/storage/index.ts");

  assert.match(helper, /server-only/);
  assert.match(helper, /evidenceArtifactsBucket = "radar-evidence-artifacts"/);
  assert.match(helper, /evidenceArtifactPathPattern = "<workspaceId>\/<artifactKind>\/<ownerId>\/<fileName>"/);
  assert.match(helper, /buildEvidenceArtifactPath/);
  assert.match(helper, /parseEvidenceArtifactPath/);
  assert.match(helper, /assertEvidenceArtifactPathForWorkspace/);
  assert.match(helper, /createEvidenceArtifactUploadUrl/);
  assert.match(helper, /createSignedUploadUrl\(storagePath\)/);
  assert.match(helper, /createEvidenceArtifactDownloadUrl/);
  assert.match(helper, /createSignedUrl\(parsedInput\.storagePath, parsedInput\.expiresInSeconds\)/);
  assert.match(helper, /removeEvidenceArtifact/);
  assert.match(index, /storage\/evidence-artifacts/);
});

test("RAD-028 documents private workspace-scoped artifact storage", async () => {
  const security = await readWorkspaceFile("docs/SECURITY.md");
  const sources = await readWorkspaceFile("docs/SOURCES_AND_EVIDENCE.md");
  const dataModel = await readWorkspaceFile("docs/DATA_MODEL.md");

  assert.match(security, /Evidence Artifact Storage/);
  assert.match(security, /signed upload and download URLs/);
  assert.match(sources, /radar-evidence-artifacts/);
  assert.match(sources, /uploaded-document/);
  assert.match(sources, /report-export/);
  assert.match(dataModel, /Evidence artifact storage/);
});

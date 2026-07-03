import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-034 validates and extracts uploaded TXT Markdown and basic PDF documents", async () => {
  const extraction = await readWorkspaceFile("src/lib/sources/file-extraction.ts");

  assert.match(extraction, /server-only/);
  assert.match(extraction, /export async function extractUploadedDocument/);
  assert.match(extraction, /defaultMaxBytes = 10 \* 1024 \* 1024/);
  assert.match(extraction, /text\/plain/);
  assert.match(extraction, /text\/markdown/);
  assert.match(extraction, /application\/pdf/);
  assert.match(extraction, /sanitizeUploadedFileName/);
  assert.match(extraction, /extractTextDocument/);
  assert.match(extraction, /extractBasicPdfText/);
  assert.match(extraction, /decodePdfLiteralString/);
  assert.match(extraction, /contentHash: hashText\(text\)/);
  assert.match(extraction, /FileExtractionError/);
  assert.match(extraction, /pdf_text_unavailable/);
});

test("RAD-034 persists uploaded documents as private artifacts source documents and chunks", async () => {
  const ingestion = await readWorkspaceFile("src/lib/sources/file-ingestion.ts");
  const storage = await readWorkspaceFile("src/lib/storage/evidence-artifacts.ts");

  assert.match(ingestion, /persistUploadedDocumentSource/);
  assert.match(ingestion, /extractUploadedDocument/);
  assert.match(ingestion, /uploadEvidenceArtifact/);
  assert.match(ingestion, /artifactKind: "uploaded-document"/);
  assert.match(ingestion, /createSourceVersion/);
  assert.match(ingestion, /createSourceDocument/);
  assert.match(ingestion, /createSourceChunk/);
  assert.match(ingestion, /chunkSourceText/);
  assert.match(ingestion, /storagePath: artifact\.storagePath/);
  assert.match(ingestion, /syncStatus: "synced"/);
  assert.match(ingestion, /syncStatus: "error"/);
  assert.match(storage, /uploadEvidenceArtifact/);
  assert.match(storage, /\.upload\(storagePath, body/);
});

test("RAD-034 wires uploaded document extraction into source create and edit actions", async () => {
  const actions = await readWorkspaceFile("src/app/(app)/sources/actions.ts");
  const form = await readWorkspaceFile("src/components/sources/source-form.tsx");

  assert.match(actions, /persistUploadedDocumentSource/);
  assert.match(actions, /uploadedFileFromFormData/);
  assert.match(actions, /uploadedFile instanceof File/);
  assert.match(actions, /uploadFailureMessage/);
  assert.match(actions, /Uploaded document extraction failed/);
  assert.match(actions, /maxUploadBytes = abusePayloadLimits\.uploadedDocumentMaxBytes/);
  assert.match(form, /accept="\.pdf,\.md,\.txt,text\/markdown,text\/plain,application\/pdf"/);
  assert.match(form, /name="uploadedFile"/);
});

test("RAD-034 documents upload storage and keeps product scope narrow", async () => {
  const dataModel = await readWorkspaceFile("docs/DATA_MODEL.md");
  const sourcesEvidence = await readWorkspaceFile("docs/SOURCES_AND_EVIDENCE.md");
  const extraction = await readWorkspaceFile("src/lib/sources/file-extraction.ts");
  const ingestion = await readWorkspaceFile("src/lib/sources/file-ingestion.ts");

  assert.match(dataModel, /RAD-034/);
  assert.match(dataModel, /PDF, Markdown, and TXT/);
  assert.match(sourcesEvidence, /RAD-034/);
  assert.match(sourcesEvidence, /uploaded-document/);

  for (const source of [extraction, ingestion]) {
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace/i);
    assert.doesNotMatch(source, /service_role|sb_secret/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});

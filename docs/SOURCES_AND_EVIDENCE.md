# Sources and Evidence

Sources are the trusted systems, documents, pages, endpoints, and artifacts Radar uses to verify assertions.

## V1 source types

- Website URL
- Pricing page URL
- Help center/docs URL
- Sitemap URL
- Uploaded PDF/Markdown/TXT
- Manual policy text
- AI support endpoint
- Generic API endpoint
- Incoming webhook/test mailbox

## Source health states

- Healthy
- Stale
- Failed
- Auth Required
- Needs Review
- Paused

## Evidence artifacts

Evidence can include source excerpts, source document versions, screenshots, Playwright traces, API responses, email receipts, webhook payloads, and generated comparison summaries.

RAD-028 stores artifact files in the private `radar-evidence-artifacts` bucket. Object paths are workspace-scoped and follow `<workspaceId>/<artifactKind>/<ownerId>/<fileName>`.

Allowed artifact kinds:

- `uploaded-document`
- `source-snapshot`
- `screenshot`
- `run-artifact`
- `report-export`

Clients should receive only signed upload or download URLs created by server-side helpers. Product records should store bounded paths and citations, not public URLs.

RAD-034 processes uploaded PDF, Markdown, and TXT source documents server-side. Uploads are size- and MIME-validated, stored as private `uploaded-document` artifacts, extracted into source documents/chunks with stable content hashes, and marked failed on the source if extraction cannot produce text.

RAD-035 source sync jobs compare each extracted content hash to existing source versions before writing a new snapshot. Unchanged syncs update health and `last_synced_at` without duplicating documents or chunks; changed syncs create a new version. Failed syncs keep the prior hash and store only a bounded error message.

RAD-036 indexing jobs process source chunks with missing embeddings and store vectors in the existing private, workspace-owned `source_chunks.embedding` field. Embedding metadata is limited to model, dimensions, job reason, timestamp, and content hash so retrieval can cite chunks without copying raw source bodies into logs or external traces.

## Change detection

Radar stores content hashes and source versions. When a source changes, Radar identifies affected assertions and reruns only those checks.

## Constraint

Sources exist to support assertions. Do not build a generic integration marketplace in V1.

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

## Change detection

Radar stores content hashes and source versions. When a source changes, Radar identifies affected assertions and reruns only those checks.

## Constraint

Sources exist to support assertions. Do not build a generic integration marketplace in V1.

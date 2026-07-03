# Security Requirements

Radar will handle sensitive customer docs, endpoints, support answers, runner credentials, and business evidence.

## Required controls

- Workspace isolation on every object.
- Supabase RLS policies for all customer-owned tables.
- Server-only secrets.
- Encrypted runner credentials.
- Private storage buckets.
- Signed URLs or authorized download routes.
- Audit logs for sensitive actions.
- Secure webhook validation.
- Rate limits and job quotas.
- Secret redaction from logs and traces.
- Data deletion and retention controls.

## Secure development rules

- Never expose provider keys to the browser.
- Never log source content to product analytics.
- Never store raw secrets in database columns without encryption.
- Never create a finding in another workspace.
- Never trust client-provided workspace_id without server-side membership verification.

## Workspace RBAC

RAD-013 defines the first application permission matrix:

- Admin: read workspace data, manage workspace settings and members, create/edit/delete assertions and sources, rerun checks, and resolve findings.
- Editor: read workspace data, create/edit assertions and sources, rerun checks, and resolve findings.
- Viewer: read workspace data only.

Server actions and route handlers must call `requireWorkspacePermission(...)` before mutating workspace-owned data. UI controls should use `WorkspacePermissionGate` or the same permission matrix to hide or explain unavailable actions, but client-side checks are never the source of truth.

## Server Action and API Guardrails

RAD-017 standardizes mutation entrypoints in `src/lib/server/guardrails.ts`. Server actions should use `runAuthenticatedServerAction(...)` for account-level work and `runWorkspaceServerAction(...)` for workspace-owned mutations. JSON route handlers should use `runAuthenticatedApiHandler(...)` or `runWorkspaceApiHandler(...)`. These helpers must validate input before writes, resolve the authenticated user on the server, resolve workspace membership on the server, enforce the required permission, and return a consistent `{ ok, data }` or `{ ok, code, error }` response envelope.

Future source, assertion, run, and finding mutations must enter through these guardrails before touching repositories or calling Supabase. Client-provided `workspace_id` values are not authorization; workspace context must come from server-side membership resolution.

## Repository Boundary

RAD-025 centralizes typed data access in `src/lib/repositories`. Repository functions must stay server-only, accept explicit workspace scope for customer-owned tables, validate mutation inputs with shared schemas, and return mapped domain types. They do not grant permissions by themselves; callers must enforce RBAC through server guardrails before invoking write functions.

## Audit Logging

RAD-016 records security-relevant actions in `audit_logs` with actor, workspace, action, resource, metadata, and timestamp. Server-side mutation helpers should call `recordAuditEvent(...)` after successful writes. Metadata must stay small and must not include raw source content, runner credentials, provider secrets, or customer-sensitive evidence bodies.

## Source Data Isolation

RAD-021 stores source records, versions, documents, and chunks with direct `workspace_id` ownership. RLS allows active workspace members to read source evidence and restricts source mutations to active Admin or Editor members. Source metadata must remain bounded and structured; raw source bodies belong only in source document/chunk storage paths or `source_chunks.content`, never in audit metadata, analytics events, Sentry context, or external traces.

## Assertion Data Isolation

RAD-022 stores assertions, assertion-source links, schedules, and test cases with direct `workspace_id` ownership. RLS allows active workspace members to read assertion data, restricts assertion/test-case/template/schedule mutations to active Admin or Editor members, and restricts assertion deletes to active Admin members.

Assertion templates may be system-level only when `workspace_id` is null and `is_system` is true. Workspace templates must be workspace-owned. Assertion metadata, test inputs, and schedule metadata must not contain runner credentials, provider secrets, webhook secrets, raw customer documents, or unbounded source content.

## Evaluation Run Data Isolation

RAD-023 stores evaluation runs and test-case results with direct `workspace_id` ownership plus workspace-scoped foreign keys back to assertions, test cases, and runs. RLS allows active workspace members to read run history, restricts run/result creation and updates to active Admin or Editor members, and restricts deletes to active Admin members.

Run `execution_metadata`, result `actual_output`, summaries, and `evidence_refs` must remain bounded. They may store synthetic runner outputs, citations, source chunk IDs, artifact paths, scores, and timings, but must not store runner credentials, provider secrets, raw webhook headers, full source documents, or unredacted PII.

## Finding Data Isolation

RAD-024 stores findings, evidence, assignments, and activity with direct `workspace_id` ownership plus workspace-scoped foreign keys back to assertions, sources, runs, and results. RLS allows active workspace members to read findings and related evidence/activity, restricts finding/evidence/assignment/activity creation or updates to active Admin or Editor members, and restricts finding deletes to active Admin members.

Finding summaries, expected/actual text, evidence quotes, activity notes, and resolution summaries must be customer-readable and bounded. They must not include runner credentials, provider secrets, raw webhook headers, full source documents, private keys, or unredacted sensitive customer data.

## Launch security bar

Before production pilots, run dependency audit, RLS tests, auth bypass tests, upload validation tests, secret scanning, and route access tests.

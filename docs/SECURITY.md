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

RAD-069 adds `runner_credentials` plus server-only credential helpers. Runner credentials are encrypted with AES-256-GCM before persistence, scoped by workspace RLS, and returned to product surfaces only as redacted summaries. Plaintext may be decrypted only inside explicit server-side execution or credential-test actions, and must not be copied into UI state, logs, runner artifacts, evaluation metadata, or audit metadata.

## Validation Boundary

RAD-026 centralizes operation-level Zod schemas in `src/lib/validation`. Server actions, API handlers, repositories, and runner jobs should reuse these request schemas instead of accepting ad hoc payloads. Repository response schemas must validate mapped objects before returning them to calling code so workspace IDs, evidence references, runner statuses, confidence scores, and finding fields stay bounded and typed.

Validation is not authorization. Client-provided IDs, statuses, source links, or evidence references are still untrusted until the server resolves workspace membership, enforces RBAC, and applies RLS-backed database constraints.

## RLS Policy Hardening

RAD-027 adds security-definer workspace membership helpers and forces RLS on workspace-owned product tables. Product policies should call `current_user_is_workspace_member(...)`, `current_user_can_edit_workspace(...)`, or `current_user_is_workspace_admin(...)` instead of repeating ad hoc `workspace_members` subqueries in every policy.

The same migration defines storage object policies for the private `radar-evidence-artifacts` bucket path convention: object names must start with the workspace UUID, members can read, Admin/Editor users can create or update, and Admin users can delete. RAD-028 owns bucket creation and storage helpers, but storage object policies must remain workspace- and role-scoped.

## Evidence Artifact Storage

RAD-028 creates the private `radar-evidence-artifacts` bucket for uploaded documents, source snapshots, screenshots, run artifacts, and report exports. Artifact object paths must use `<workspaceId>/<artifactKind>/<ownerId>/<fileName>` so storage RLS can enforce the same workspace and role checks as database records.

Application code must use server-only helpers to build paths and create signed upload and download URLs. Do not expose Supabase service credentials to clients, do not create public artifact URLs, and do not store raw runner secrets or full source payloads in artifact metadata.

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

RAD-077 requires `finding:resolve` permission for all finding lifecycle changes. The server action validates the active workspace, checks the current finding belongs to that workspace, enforces allowed status transitions, writes `finding_activity`, and records a workspace audit event without logging raw evidence or secrets.

RAD-078 validates assignees against active members of the current workspace before updating `owner_user_id` or assignment history. Ownership notes and metadata are bounded, team values are restricted to Radar's operational team list, and audit events store only IDs, status/severity values, and team labels.

## Rate Limits, Quotas, And Abuse Controls

RAD-095 adds durable abuse-limit events in `abuse_limit_events`. Each event is workspace-scoped, can include the acting user, and is protected by RLS so only workspace members can read or insert their own workspace events. The table records bounded metadata only; it must not store source bodies, prompts, completions, request bodies, credentials, cookies, or raw evidence.

`src/lib/abuse/limits.ts` defines workspace and user sliding-window limits for source syncs, evaluation run queueing, AI calls, API requests, file uploads, and runner executions.

Payload ceilings live in the same module, including uploaded document size, manual text length, evidence retrieval query length, and Knowledge Runner endpoint response length. Runner duration controls are centralized: Knowledge endpoint fetches have an abort timeout, Journey and Integration runners keep their timeout schemas, and runner execution events are recorded when queued jobs are claimed.

Server actions call `checkAndRecordAbuseLimit` before expensive operations. Workspace JSON APIs use the shared guardrail `rateLimit` option and return `rate_limited` with HTTP 429 when a window is exceeded.

## Security Hardening Audit

RAD-096 hardens launch defaults and records the security audit scope:

- Next.js sends global security headers from `next.config.ts`: CSP report-only, frame denial, content-type sniffing protection, referrer policy, and a restricted permissions policy.
- Supabase local auth defaults require 12-character mixed passwords, secure password-change reauthentication, slower email resend frequency, 8-character OTPs, and shorter OTP expiry.
- Stripe webhooks require a verified `stripe-signature` before parsing and reject malformed signed payloads with a controlled 400 response.
- Uploaded TXT, Markdown, and PDF documents pass a content safety scan before extraction. Executable signatures, script-like text payloads, and executable/script extensions are rejected.
- Sensitive logging remains restricted to scripts/tests; application runtime code must not log secrets, source bodies, prompts, completions, webhook bodies, cookies, or credentials.

## Launch security bar

Before production pilots, run dependency audit, RLS tests, auth bypass tests, upload validation tests, secret scanning, and route access tests.

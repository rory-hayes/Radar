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

## Audit Logging

RAD-016 records security-relevant actions in `audit_logs` with actor, workspace, action, resource, metadata, and timestamp. Server-side mutation helpers should call `recordAuditEvent(...)` after successful writes. Metadata must stay small and must not include raw source content, runner credentials, provider secrets, or customer-sensitive evidence bodies.

## Launch security bar

Before production pilots, run dependency audit, RLS tests, auth bypass tests, upload validation tests, secret scanning, and route access tests.

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

## Launch security bar

Before production pilots, run dependency audit, RLS tests, auth bypass tests, upload validation tests, secret scanning, and route access tests.

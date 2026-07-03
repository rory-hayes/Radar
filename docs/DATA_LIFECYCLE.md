# Data Lifecycle

Radar stores only the workspace data needed to verify customer-facing assertions and explain findings.

## Stored data

- Workspace profile, membership roles, and audit events.
- Sources, source versions, extracted source documents, and bounded source chunks.
- Assertions, schedules, source links, and test cases.
- Evaluation runs, test case results, evidence references, and runner metadata.
- Findings, finding evidence, ownership history, and finding activity.
- Notification delivery records, billing summary records, abuse-control counters, and redacted runner credential summaries.
- Private evidence artifacts in the `radar-evidence-artifacts` bucket.

## Source deletion

Workspace admins can delete a source from the source detail page. Radar requires typing the source name before deletion. The server action:

1. Verifies the active workspace and `source:delete` permission.
2. Loads the source through the workspace-scoped repository.
3. Lists private storage paths from `source_documents`.
4. Removes the matching Supabase Storage objects from `radar-evidence-artifacts`.
5. Deletes the source row, allowing database cascades to remove source versions, source documents, source chunks, assertion links, and source-scoped finding evidence.
6. Writes a `source.deleted` audit event with bounded metadata.

If artifact cleanup fails, the source row is not deleted.

## Workspace export

Workspace admins can download a JSON export from Settings. The export includes workspace-owned records for sources, assertions, runs, findings, notifications, audit logs, billing summary, abuse counters, and redacted runner credential summaries.

Exports deliberately omit encrypted runner credential values, Stripe object identifiers, provider message IDs, preferences URLs, unsubscribe URLs, and signed artifact download URLs. Private artifact paths are included only as a manifest so operators can reconcile stored files without exposing temporary access URLs.

## Retention

Each workspace has a `data_retention_days` setting with allowed values of 30, 90, 180, or 365 days. The current value appears in Settings and is included in workspace exports with the calculated cutoff timestamp.

Retention controls are intentionally workspace-wide for V1. They apply to workspace-owned run and evidence records and do not create per-assertion or per-source retention policies.

## Boundaries

- Deletion and export are admin-only operations.
- Source deletion removes source-owned data; it does not delete the workspace, users, billing records, or unrelated assertions.
- Workspace export is a portability and audit artifact, not a backup restore format.
- Private artifacts remain private; exports never mint signed download URLs.

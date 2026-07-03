# Radar Seed Files

This directory is reserved for deterministic local/test seed fragments.

Rules:

- Keep `supabase/seed.sql` as the entrypoint.
- Add ordered SQL files here only after the relevant schema exists.
- Use stable synthetic IDs and slugs so `pnpm db:reset` produces the same local state every time.
- Scope every customer-owned record by `workspace_id` or a workspace-owned parent.
- Never include real customer content, provider credentials, runner secrets, service role keys, webhook secrets, or production URLs.
- Never import these files into product runtime code.

RAD-009 defines the contract. RAD-019 adds `radar-demo-workspace.sql`, which seeds the first representative local/test workspace and users using only schemas that exist in Phase 1. Until source, assertion, run, and finding tables exist, representative product examples are recorded as workspace-scoped `audit_logs` metadata rather than standalone product rows.

# Radar Seed Files

This directory is reserved for deterministic local/test seed fragments.

Rules:

- Keep `supabase/seed.sql` as the entrypoint.
- Add ordered SQL files here only after the relevant schema exists.
- Use stable synthetic IDs and slugs so `pnpm db:reset` produces the same local state every time.
- Scope every customer-owned record by `workspace_id` or a workspace-owned parent.
- Never include real customer content, provider credentials, runner secrets, service role keys, webhook secrets, or production URLs.
- Never import these files into product runtime code.

RAD-009 defines the contract. RAD-019 adds `radar-demo-workspace.sql`, which seeds the first representative local/test workspace and users. Phase 2 extends that file with representative sources, assertions, evaluation runs, findings, evidence, assignments, and activity records as those schemas become available.

RAD-029 verifies this seed coverage through `pnpm db:harness` and applies it with migrations through `pnpm db:harness:apply` when Docker is running.

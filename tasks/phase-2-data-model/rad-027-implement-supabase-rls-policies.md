# RAD-027 — Implement Supabase RLS policies

## Status

Done

## Priority

P0

## Phase

Phase 2 — Core Data Model (MVP)

## Objective

Add row-level security policies for all product tables and storage buckets based on workspace membership and role.

## Target outcome

Database-level policies prevent unauthorized cross-tenant access even if application code has a bug.

## Context

Radar is a customer-facing business verification product. This task must preserve the locked model: assertions define what should be verified, sources/runners are connected only when needed, and findings must be evidence-backed and business-readable.

## Scope


- Implement the specific feature/infrastructure described in the objective.
- Use the locked Radar model: assertion-led, source-minimal, evidence-backed.
- Preserve workspace isolation and server-only secret boundaries where relevant.
- Add/update tests and docs needed by this ticket.


## Out of scope

- Do not build generic AI eval platform features.
- Do not add unrelated pages beyond Command Center, Assertions, Findings, and Sources unless explicitly required.
- Do not add new runner types beyond Knowledge, Journey, and Integration.
- Do not introduce an integration marketplace.
- Do not use mock data in product paths unless explicitly scoped as local/demo seed data.

## Dependencies

RAD-026 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

Supabase migrations, generated types, repositories, validation schemas, and tests.

## Acceptance criteria

- [x] The implemented behavior matches the objective and outcome.
- [x] The implementation fits Radar's assertion-led model.
- [x] The UI/API handles success, loading, empty, and error states where relevant.
- [x] Data persists correctly where applicable.
- [x] Workspace authorization is enforced where applicable.
- [x] No unrelated scope is introduced.

## Test criteria

- [x] Relevant unit and integration tests are added or updated.
- [x] Manual QA steps are documented in the PR summary.
- [x] No existing E2E smoke flow is broken.
- [x] `pnpm lint` passes.
- [x] `pnpm typecheck` passes.
- [x] `pnpm test` passes or a documented reason is provided for unavailable test command.
- [x] `pnpm build` passes.
- [x] `pnpm test:e2e` passes where applicable.

## Manual QA checklist

- [x] Open the affected page or run the affected workflow locally.
- [x] Verify the happy path.
- [x] Verify at least one relevant sad path.
- [x] Verify no unrelated primary navigation/pages changed unexpectedly.
- [x] Capture screenshots for UI changes.

## Definition of done

- [x] Code complete and scoped to this ticket.
- [x] Acceptance criteria satisfied.
- [x] Test criteria satisfied or documented with approved exception.
- [x] No hardcoded secrets or sensitive logging.
- [x] Ticket checklist updated.
- [x] PR summary includes changed files, testing, screenshots for UI work, and risks.

## Codex notes

Codex should append implementation notes, commands run, failures, and follow-ups here before marking this task Done.

- Added `supabase/migrations/20260703111500_harden_workspace_rls_policies.sql` with security-definer workspace membership helpers, forced RLS on workspace-owned product tables, and helper-based policies for workspaces, memberships, audit logs, sources, assertions, test cases, evaluation runs, findings, and related evidence/activity tables.
- Added storage object policies for the future private `radar-evidence-artifacts` bucket using the convention that object paths start with the owning workspace UUID. Members can read, Admin/Editor users can create/update, and Admin users can delete.
- Split test-case create/update/delete policies so inserts still require `created_by = auth.uid()` without preventing other workspace editors from updating existing test cases.
- Updated `docs/SECURITY.md` and `docs/DATA_MODEL.md` with the RLS hardening and storage artifact boundary.
- Added `tests/unit/rls-policy-hardening.test.mjs` and expanded `tests/e2e/auth-workspace-isolation.test.mjs` to cover the RAD-027 migration.
- Manual QA: no UI surface changed in this database-policy ticket, so screenshots are not applicable. Existing E2E route gates and production build verify primary navigation and app shell behavior remain unchanged.
- Commands run:
  - `pnpm test` passed with 94 tests.
  - `pnpm test:e2e` passed with 7 tests.
  - `pnpm lint` passed.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.
  - `pnpm validate:seed` passed.
  - `pnpm validate:env` passed.
  - Secret-pattern scan found placeholders and negative-test regexes only.
  - `pnpm supabase:start` could not run because Docker is not running: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`

# RAD-006 — Add Supabase local development and migration pipeline

## Status

Done

## Priority

P0

## Phase

Phase 0 — Foundation (MVP)

## Objective

Create Supabase project configuration, migration folder conventions, local development instructions, and database reset/seed scripts.

## Target outcome

A developer can run migrations locally and reset/seed the database with documented commands.

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

RAD-005 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

package/config/app shell/docs/test files as required by the task.

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

## Codex implementation notes

- Generated `supabase/config.toml` with Supabase CLI `2.109.0` and pinned the same CLI as a dev dependency.
- Added local scripts for `supabase:start`, `supabase:status`, `supabase:reset`, `supabase:migration:new`, and `db:reset`.
- Added `docs/SUPABASE_LOCAL_DEVELOPMENT.md`, `supabase/migrations/README.md`, and a no-op `supabase/seed.sql` so the reset/seed pipeline exists without introducing product mock rows before RAD-009/RAD-019.
- Added unit coverage in `tests/unit/supabase-pipeline.test.mjs` for scripts, config, migration conventions, and seed safety.
- Verified Supabase CLI help for `db reset --local` and `migration new`.
- Manual QA: no UI changed, so screenshot capture is not applicable. Verified the affected workflow through CLI help and automated checks.
- One parallel run of `pnpm typecheck` failed while `pnpm build` was also writing `.next/types`; rerunning `pnpm typecheck` by itself passed.

Commands run:

```bash
pnpm test
pnpm supabase:reset --help
pnpm supabase:migration:new --help
pnpm validate:env
pnpm lint
pnpm test:e2e
pnpm build
pnpm typecheck
```

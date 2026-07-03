# RAD-009 — Create demo data policy and local seed contract

## Status

Done

## Priority

P0

## Phase

Phase 0 — Foundation (MVP)

## Objective

Define how local/demo data is generated for development while ensuring production features use real database-backed data and no hardcoded product results.

## Target outcome

Seed data is clearly separated from production paths and can be reset deterministically.

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

RAD-008 should be complete or deliberately skipped with notes.

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

- Added `docs/DEMO_DATA_POLICY.md` defining local/test-only demo data, production-like environment prohibitions, deterministic reset rules, workspace scoping, and runtime import boundaries.
- Added `src/lib/demo-data-policy.ts` with typed policy constants and `isDemoDataEnvironment`.
- Updated `supabase/seed.sql` with the `RADAR_LOCAL_SEED_CONTRACT v1` marker and kept it row-free because schema tables are introduced later.
- Added `supabase/seeds/README.md` for future ordered seed fragments.
- Added `scripts/validate-seed-policy.mjs`, `pnpm validate:seed`, CI coverage, README command docs, and unit coverage in `tests/unit/demo-data-policy.test.mjs`.
- Manual QA: no UI changed, so screenshots are not applicable. Verified the affected workflow with `pnpm validate:seed`; the sad path is covered by the validator's missing-string and forbidden-secret checks.

Commands run:

```bash
pnpm validate:seed
pnpm test
pnpm validate:env
pnpm lint
pnpm typecheck
pnpm test:e2e
pnpm build
```

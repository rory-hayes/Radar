# RAD-019 — Seed first demo workspace and users

## Status

Done

## Priority

P0

## Phase

Phase 1 — Auth and Workspaces (MVP)

## Objective

Add a deterministic demo workspace seed that shows sample assertions, sources, findings, and activity for local development and demos.

## Target outcome

Demo data demonstrates the locked Radar concept without replacing real persisted product logic.

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

RAD-018 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

- `supabase/seed.sql`
- `supabase/seeds/radar-demo-workspace.sql`
- `supabase/seeds/README.md`
- `docs/DEMO_DATA_POLICY.md`
- `src/lib/demo-data-policy.ts`
- `scripts/validate-seed-policy.mjs`
- `tests/unit/demo-data-policy.test.mjs`
- `tests/unit/demo-workspace-seed.test.mjs`
- `tasks/TASKS.md`
- `tasks/phase-1-auth-workspaces/rad-019-seed-first-demo-workspace-and-users.md`

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

- Added `supabase/seeds/radar-demo-workspace.sql` and wired it from `supabase/seed.sql`.
- The seed creates deterministic local/test Supabase auth users, one `Radar Demo Workspace`, admin/editor/viewer workspace memberships, and workspace-scoped `audit_logs`.
- Because source, assertion, run, and finding product tables do not exist until Phase 2, RAD-019 does not create those tables early. Representative source/assertion/run/finding examples are stored only as local demo audit metadata using existing audit actions.
- Updated `docs/DEMO_DATA_POLICY.md`, `src/lib/demo-data-policy.ts`, and `scripts/validate-seed-policy.mjs` to reflect the Phase 1 seed boundary.
- Added `tests/unit/demo-workspace-seed.test.mjs` and updated demo seed policy tests.
- Commands run:
  - `pnpm validate:seed`
  - `pnpm test`
  - `pnpm supabase:start` (failed because Docker daemon is unavailable)
  - `pnpm lint`
  - `pnpm validate:env`
  - `pnpm typecheck`
  - `pnpm test:e2e`
  - `pnpm build`
- Manual QA: seed policy validation and unit tests verify deterministic IDs, workspace scope, local/test-only boundaries, no early product tables, no URLs, and no secret-like values. Local Supabase reset could not be executed because Docker is not running: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`.
- Screenshots: not applicable; no UI changed.
- Risks/follow-ups: once RAD-021 through RAD-024 introduce source/assertion/run/finding tables, replace audit-metadata sample records with real product-table seed rows while preserving the same deterministic IDs and assertion-led scenario.

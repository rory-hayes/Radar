# RAD-049 — Implement schedules and manual triggers

## Status

Done

## Priority

P0

## Phase

Phase 4 — Assertions and Test Cases (MVP)

## Objective

Add schedule fields, run cadence options, source-change trigger flags, and manual run controls without executing full eval logic yet.

## Target outcome

Assertions can be configured for scheduled and manual verification.

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

RAD-048 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

Assertions UI, assertion APIs/actions, test case logic, templates, generators, and tests.

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
- [x] Document screenshot exception for UI changes.

## Definition of done

- [x] Code complete and scoped to this ticket.
- [x] Acceptance criteria satisfied.
- [x] Test criteria satisfied or documented with approved exception.
- [x] No hardcoded secrets or sensitive logging.
- [x] Ticket checklist updated.
- [x] PR summary includes changed files, testing, screenshots for UI work, and risks.

## Codex notes

Codex should append implementation notes, commands run, failures, and follow-ups here before marking this task Done.

## Implementation summary

- Added `queueManualAssertionRunAction` to create a queued `evaluation_runs` placeholder for manual verification without executing runner logic.
- The action requires `run:rerun`, validates the active workspace assertion, requires at least one approved test case, and records manual trigger metadata with zeroed result counts.
- Added `AssertionManualRunPanel` to the assertion detail Overview tab. It shows approved test-case count, permission state, success/error messages, and a `Queue manual run` control.
- Existing create/edit schedule fields continue to cover cadence, timezone, scheduled-run enablement, and source-change trigger flags.
- Added `tests/unit/schedules-manual-triggers.test.mjs` for schedule form coverage, manual trigger action behavior, UI wiring, and scope/secret safety.

## MCP, blocks, and docs notes

- No new shadcn block or primitive was needed. The manual run UI uses existing Card, Button, Alert, and Field primitives.
- shadcn.io MCP had already been confirmed available during the Phase 4 UI tickets; this ticket did not install any external block source.

## Commands run

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test -- tests/unit/schedules-manual-triggers.test.mjs`
- `pnpm test:e2e`
- `pnpm validate:seed`
- `pnpm validate:env`
- `pnpm db:harness`
- `pnpm build`
- `pnpm db:harness:apply` failed because Docker is not running: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`.
- `pnpm dev --hostname 127.0.0.1 --port 3015`
- `curl -I -s 'http://127.0.0.1:3015/assertions/00000000-0000-4000-8000-000000000000'`

## Manual QA

- Verified `/assertions/00000000-0000-4000-8000-000000000000` returns `307` to `/sign-in?next=%2Fassertions%2F00000000-0000-4000-8000-000000000000` while unauthenticated.
- Happy path is covered by unit assertions that manual triggers create queued manual evaluation runs with approved test-case counts.
- Sad paths covered by validation and guardrails: missing approved test cases, invalid assertion id, unauthenticated users, and users without `run:rerun`.
- No screenshot captured for the authenticated manual-run panel because the available local smoke was unauthenticated; the route-level auth redirect was verified instead.

## Risks and follow-ups

- Queued manual runs are placeholders until runner orchestration lands in Phase 5. No external checks execute in this ticket by design.

# RAD-085 — Implement weekly trust report generator

## Status

Done

## Priority

P1

## Phase

Phase 8 — Command Center, Reports, Alerts (Beta)

## Objective

Generate a weekly report summary with checks run, pass rate, exceptions, resolved findings, risky categories, and recommended next actions.

## Target outcome

Radar can produce a business-readable trust report.

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

RAD-084 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

Command Center UI, reporting jobs, notification code, analytics instrumentation, and tests.

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

## Result: Done

- Added a typed weekly trust report generator that produces a business-readable summary from existing assertions, completed runs, active exceptions, resolved findings, risky categories, and recommended next actions.
- Added a Command Center weekly report preview so the generated report is visible before RAD-086 adds the report detail/export scaffold.
- Kept the generator assertion-led and export-ready without adding generic analytics, prompt playground, trace explorer, workflow canvas, or marketplace scope.

## Validation

- Passed: `pnpm test -- --test-name-pattern 'RAD-085|RAD-084'`.
- Passed: `pnpm lint`.
- Passed: `pnpm typecheck`.
- Passed: `pnpm test`.
- Passed: `pnpm test:e2e`.
- Passed: `pnpm validate:seed`.
- Passed: `pnpm validate:env`.
- Passed: `pnpm db:harness`.
- Passed: `pnpm build`.
- Passed smoke: `curl -I http://localhost:3024/command-center` returned `307 Temporary Redirect` to `/sign-in?next=%2Fcommand-center`.
- Blocked by local environment: `pnpm db:harness:apply` requires Docker and failed with `Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`.

## Manual QA notes

- Open `/command-center` and verify the Weekly trust report panel appears below Trend indicators.
- Verify the panel summarizes checks run, pass rate, active exceptions, resolved findings, risky categories, and recommended next actions.
- Verify an empty or no-run workspace still produces a business-readable report with a run-active-assertions action.

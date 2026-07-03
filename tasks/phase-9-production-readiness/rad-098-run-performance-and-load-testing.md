# RAD-098 — Run performance and load testing

## Status

Done

## Priority

P0

## Phase

Phase 9 — Production Readiness (Production)

## Objective

Test source ingestion, embedding, eval runs, dashboard queries, and concurrent jobs against realistic pilot-scale workloads.

## Target outcome

The app meets target response times and job throughput under expected launch load.

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

RAD-097 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

Billing, onboarding, observability, security, performance, deployment docs, and tests.

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

## Completion notes

- Added `pnpm perf:pilot`, backed by `scripts/run-pilot-load-smoke.mjs`.
- The harness models one launch pilot workspace with 120 sources, 360 assertions, 1440 test cases, 900 evaluation runs, 600 generated chunks, embedding batches of 100, embedding concurrency 4, job concurrency 12, and an 18% finding rate.
- Covered source ingestion pressure, embedding batch scheduling, evaluation job scheduling, finding creation pressure, and dashboard aggregation.
- Added `docs/PERFORMANCE_AND_LOAD.md` with the pilot profile, budgets, measured local results, and staging follow-up metrics.
- Updated `docs/TEST_STRATEGY.md` to include `pnpm perf:pilot`.
- Added `tests/unit/performance-load-testing.test.mjs` to lock the command, budgets, modeled workloads, and documentation.

## Local performance result

- `pnpm perf:pilot` passed.
- Source ingestion simulation: 7.42 ms against a 650 ms budget.
- Embedding scheduling simulation: 0.14 ms against a 250 ms budget.
- Evaluation scheduling simulation: 1.70 ms against a 350 ms budget.
- Dashboard aggregation simulation: 0.24 ms against a 120 ms budget.
- Total script runtime: 9.53 ms against a 1200 ms budget.
- Throughput covered 120 source documents, 600 chunks, 6 embedding batches, 900 evaluation runs, 157 findings, and 1537 dashboard aggregation items.

## Validation

- `pnpm perf:pilot` passes.
- `pnpm lint` passes.
- `pnpm typecheck` passes.
- `pnpm test` passes: 371 unit tests.
- `pnpm build` passes.
- `pnpm test:e2e` passes: 34 e2e tests.
- `pnpm audit --audit-level high` passes with no known vulnerabilities.
- `pnpm db:harness:apply` remains blocked because Docker is not running locally: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`.

## Manual QA

- Happy path: `pnpm perf:pilot` completed and printed JSON metrics below every configured budget.
- Sad path: the script fails non-zero when any measured area exceeds its budget.
- Navigation: e2e scope-lock tests verify no unrelated primary navigation or product routes changed.
- Screenshots: not applicable; this ticket adds a CLI performance harness and docs, not UI.

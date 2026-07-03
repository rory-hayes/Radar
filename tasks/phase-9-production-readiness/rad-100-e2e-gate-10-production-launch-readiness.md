# RAD-100 — E2E Gate 10 — Production launch readiness

## Status

Done

## Priority

P0

## Phase

Phase 9 — Production Readiness (Production)

## Objective

Run the final production-readiness gate covering full product flow, security, billing, observability, performance, alerts, rollback, and pilot customer acceptance.

## Target outcome

Radar is ready for controlled production pilots and paid customer usage.

## Context

Radar is a customer-facing business verification product. This task must preserve the locked model: assertions define what should be verified, sources/runners are connected only when needed, and findings must be evidence-backed and business-readable.

## Scope


- Run the E2E validation scope described in this ticket.
- Fix regressions introduced in the current phase where feasible.
- Produce a concise phase gate report in the ticket notes.
- Do not start the next phase if blocking failures remain.


## Out of scope

- Do not build generic AI eval platform features.
- Do not add unrelated pages beyond Command Center, Assertions, Findings, and Sources unless explicitly required.
- Do not add new runner types beyond Knowledge, Journey, and Integration.
- Do not introduce an integration marketplace.
- Do not use mock data in product paths unless explicitly scoped as local/demo seed data.

## Dependencies

RAD-099 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This is an E2E gate. It must stop phase progression until complete.

## Expected files touched

Billing, onboarding, observability, security, performance, deployment docs, and tests.

## Acceptance criteria

- [x] Gate report summarizes pass/fail status and any regressions.
- [x] Blocking failures are fixed or explicitly documented as accepted deferrals.
- [x] Codex stops and summarizes before moving to the next phase.
- [x] Data persists correctly where applicable.
- [x] Workspace authorization is enforced where applicable.
- [x] No unrelated scope is introduced.
- [x] UI/product scope drift check completed: no generic eval platform, no template bloat, navigation remains locked.

## Test criteria

- [x] Full phase E2E flow is executed.
- [x] Core smoke scripts are run.
- [x] Regression notes are documented in the ticket file or PR summary.
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

- Added the RAD-100 E2E gate covering the final production launch-readiness contract.
- Verified the complete assertion-led flow: source creation/sync, assertion creation, manual run queueing, Knowledge/Journey/Integration runners, finding lifecycle/rerun controls, weekly report, notifications, and activation checklist.
- Verified launch controls for strict environment validation, security headers, signed Stripe webhooks, billing gates, data export/deletion, abuse limits, Sentry, Langfuse, performance smoke, CI gates, migrations, rollback, incident response, and launch checklist.
- Verified all Phase 9 tickets are Done and primary navigation remains locked to Command Center, Assertions, Findings, and Sources.

## Gate report

- Status: Passed.
- Blocking regressions: none.
- Accepted deferrals: Docker-backed local database apply remains dependent on the local Docker daemon.
- Pilot-readiness result: ready for controlled production pilots once production provider dashboards are configured and the Docker-backed migration apply harness is run in an environment with Docker available.
- Scope check: no generic eval platform, prompt playground, trace explorer, workflow canvas, integration marketplace, broad analytics product, or template bloat added.

## Validation

- `pnpm lint` passes.
- `pnpm typecheck` passes.
- `pnpm test` passes: 374 unit tests.
- `pnpm perf:pilot` passes with 155.27 ms total runtime against the 1200 ms budget.
- `pnpm build` passes.
- `pnpm test:e2e` passes: 38 e2e tests.
- `pnpm audit --audit-level high` passes with no known vulnerabilities.
- `pnpm db:harness:apply` remains blocked because Docker is not running locally: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`.

## Manual QA

- Happy path: RAD-100 gate verifies source-to-assertion-to-run-to-finding-to-report/alert readiness across code and docs.
- Sad path: RAD-100 gate verifies rollback, incident response, failed provider states, strict env validation, signed webhook rejection, and abuse-limit boundaries.
- Navigation: e2e scope-lock tests verify no unrelated primary navigation or product routes changed.
- Screenshots: not applicable; this ticket adds a production launch-readiness e2e gate and task report, not UI.

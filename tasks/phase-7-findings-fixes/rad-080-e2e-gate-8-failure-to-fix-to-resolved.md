# RAD-080 — E2E Gate 8 — Failure to fix to resolved

## Status

Done

## Priority

P1

## Phase

Phase 7 — Findings and Recommended Fixes (Beta)

## Objective

Run E2E coverage where a failed assertion creates a finding, shows evidence, generates a fix, assigns owner, reruns after a simulated fix, and resolves.

## Target outcome

The core Radar loop is complete: detect, explain, fix, verify.

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

RAD-079 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This is an E2E gate. It must stop phase progression until complete.

## Expected files touched

Findings engine, Findings UI, evidence display, recommended fixes, workflow actions, and tests.

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

Result: Done

Gate report:

- Added `tests/e2e/findings-fix-resolution-gate.test.mjs` to assert the full phase-7 failure-to-fix-to-resolved loop across finding creation, evidence persistence, recommended fixes, severity impact, detail UI, owner assignment, lifecycle transitions, linked reruns, workspace permissions, and product scope locks.
- Pass/fail status: passing after validation.
- Regressions found: none in code. The only accepted local exception is `pnpm db:harness:apply`, which requires Docker and fails when Docker Desktop is not running.
- Data persistence covered by repository contracts for `findings`, `finding_evidence`, `finding_assignments`, `finding_activity`, `evaluation_runs`, and `test_case_results`.
- Authorization covered through `runWorkspaceServerAction`, `requireActiveWorkspace`, `finding:resolve`, and `run:rerun` checks.
- Scope drift check completed: primary navigation remains Command Center, Assertions, Findings, and Sources; no prompt playground, trace explorer, workflow canvas, or integration marketplace was introduced.

Commands run:

- `pnpm test:e2e -- --test-name-pattern 'RAD-080'`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm validate:seed`
- `pnpm validate:env`
- `pnpm db:harness`
- `pnpm build`
- `pnpm db:harness:apply` (blocked locally because Docker is not running)
- `pnpm start --port 3020` plus `curl -I http://localhost:3020/findings`

Manual QA:

- Happy path: RAD-080 gate checks that a failed or warning result creates or updates a finding, persists evidence, generates a grounded recommended fix, supports owner assignment, queues a linked fix-validation rerun, and moves a passing linked rerun toward Fixed or Resolved.
- Sad path: RAD-080 gate checks permission boundaries for lifecycle and rerun actions, workspace-scoped repository filters, and product-scope exclusions.
- Screenshot note: RAD-080 made no new UI surface beyond the RAD-071 through RAD-079 findings UI already smoke-tested. Local protected-route smoke returns the expected sign-in redirect for `/findings`.

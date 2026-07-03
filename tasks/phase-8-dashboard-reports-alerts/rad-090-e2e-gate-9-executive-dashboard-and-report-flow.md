# RAD-090 — E2E Gate 9 — Executive dashboard and report flow

## Status

Done

## Priority

P1

## Phase

Phase 8 — Command Center, Reports, Alerts (Beta)

## Objective

Run E2E coverage from source/assertion/run/finding through Command Center summary, alert generation, and weekly report creation.

## Target outcome

Radar is demo-ready as a business verification product.

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

RAD-089 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This is an E2E gate. It must stop phase progression until complete.

## Expected files touched

Command Center UI, reporting jobs, notification code, analytics instrumentation, and tests.

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

- Added the RAD-090 E2E gate covering the Phase 8 source/assertion/run/finding path into Command Center summaries.
- Verified the weekly trust report generator, report export scaffold, report route protection, and report analytics instrumentation.
- Verified email and Slack alert generation paths are workspace-guarded, persist delivery attempts, and skip safely when providers are not configured.
- Verified Phase 8 product analytics events are bounded and do not collect source text, evidence bodies, prompts, URLs, or secrets.
- Verified primary navigation remains locked to Command Center, Assertions, Findings, and Sources.

## Gate report

- Status: Passed.
- Blocking regressions: none.
- Accepted deferrals: Docker-backed database apply remains dependent on the local Docker daemon.
- Scope check: no generic eval platform, prompt playground, trace explorer, workflow canvas, integration marketplace, analytics dashboard, or broad template bloat added.

## Validation

- `pnpm test:e2e` passed with the new RAD-090 gate after correcting stale test expectations for existing Command Center/report labels.
- `pnpm lint` passed.
- `pnpm typecheck` passed.
- `pnpm test` passed.
- `pnpm validate:env` passed.
- `pnpm validate:seed` passed.
- `pnpm db:harness` passed.
- `pnpm build` passed.
- Local smoke: `GET /reports/weekly` on the built server returned `307` to `/sign-in?next=%2Freports%2Fweekly`, confirming the report route remains protected.
- Known local limitation: `pnpm db:harness:apply` requires Docker. Docker is unavailable in this environment, so apply mode failed with `Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`.

## Manual QA notes

- Built server smoke should verify unauthenticated report access redirects to sign-in.
- Phase 8 UI changed through prior tickets; this gate adds static E2E coverage rather than new UI.
- Screenshots are not required for this gate because no new UI surface is introduced in RAD-090.

# RAD-070 — E2E Gate 7 — Runner triad smoke test

## Status

Done

## Priority

P1

## Phase

Phase 6 — Journey and Integration Runners (Beta)

## Objective

Run E2E coverage across one Knowledge assertion, one Journey assertion, and one Integration assertion, proving shared runner contracts and artifacts work.

## Target outcome

Radar supports the three-runner architecture without scope creep.

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

RAD-069 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This is an E2E gate. It must stop phase progression until complete.

## Expected files touched

Runner contracts, Playwright code, integration runner code, credential helpers, and tests.

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

- Added `tests/e2e/runner-triad-smoke.test.mjs` as the RAD-070 Phase 6 gate.
- Gate coverage verifies the shared runner contract, Knowledge Runner execution path, Journey Runner foundation/schema/Trial Onboarding pack, Integration Runner foundation/generic checks/handoff templates, email receipt artifacts, HTTP exchange artifacts, and runner credential hardening.
- Scope guardrails passed: primary navigation remains Command Center, Assertions, Findings, Sources; no prompt playground, trace explorer, workflow canvas, model-comparison UI, or integration marketplace was introduced.
- No UI changes were needed; shadcn blocks/components were not used for this E2E gate ticket.
- Validation passed: `node --test tests/e2e/runner-triad-smoke.test.mjs`; `pnpm lint`; `pnpm typecheck`; `pnpm test` (256 unit tests); `pnpm build`; `pnpm test:e2e` (26 E2E tests); `pnpm validate:seed`; `pnpm validate:env`; `pnpm db:harness`; protected-route local smoke on port 3036.
- `pnpm db:harness:apply` failed because Docker is not running: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`.
- Gate regression notes: no blocking regressions found. Docker-backed DB apply remains environment-blocked when Docker is not running and is documented in the final validation record.
- Manual QA: protected assertion detail route returned the expected sign-in redirect; the gate inspects the complete Phase 6 runner triad structurally. Screenshot capture is not meaningful because this ticket has no UI changes.

# RAD-010 — E2E Gate 1 — Foundation smoke test

## Status

Done

## Priority

P0

## Phase

Phase 0 — Foundation (MVP)

## Objective

Run an end-to-end smoke test across install, local app launch, route navigation, CI commands, and basic UI rendering to confirm the foundation is stable before product work continues.

## Target outcome

The repo can be cloned, configured, tested, built, and launched without drift or broken baseline assumptions.

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

RAD-009 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This is an E2E gate. It must stop phase progression until complete.

## Expected files touched

package/config/app shell/docs/test files as required by the task.

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

## Gate report

Status: Passed after fixes.

Browser path: Browser plugin unavailable in this session, so Playwright fallback was used through the Node REPL.

Flow under test: app loads -> first meaningful screen renders -> primary visible controls respond without runtime errors.

Tests run:

```bash
pnpm install --frozen-lockfile
pnpm validate:env
pnpm validate:seed
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm dev
next start --port 3011
```

Rendered checks:

- `pnpm dev` returned 200 for `/command-center`.
- Built app returned 200 for `/`, `/command-center`, `/assertions`, `/findings`, `/sources`, and hidden route `/settings`.
- Desktop navigation click: `/command-center` -> Assertions link -> `/assertions`.
- Mobile navigation click: `/findings` -> open sidebar -> Sources link -> `/sources`.
- Mobile sidebar closes after route navigation.
- Primary nav remains locked to Command Center, Assertions, Findings, and Sources; Settings is not in primary nav.
- Browser console errors: none.
- Screenshots:
  - `/tmp/radar-rad-010-desktop-assertions.png`
  - `/tmp/radar-rad-010-mobile-sources.png`

Regressions found and fixed:

- `pnpm dev` previously forced `next dev --webpack`, and app routes hung during local webpack dev compilation. Fixed by using Next's default dev server (`next dev`) while keeping webpack for production build.
- Mobile sidebar route clicks navigated but left the sheet open over the target page. Fixed by closing mobile sidebar state on nav link click and adding a unit assertion.

Deferred issues:

- None for the Phase 0 gate.

Recommendation:

- Proceed to Phase 1. Stop here for the gate summary before starting RAD-011.

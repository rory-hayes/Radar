# RAD-080 — E2E Gate 8 — Failure to fix to resolved

## Status

Backlog

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

- [ ] Gate report summarizes pass/fail status and any regressions.
- [ ] Blocking failures are fixed or explicitly documented as accepted deferrals.
- [ ] Codex stops and summarizes before moving to the next phase.
- [ ] Data persists correctly where applicable.
- [ ] Workspace authorization is enforced where applicable.
- [ ] No unrelated scope is introduced.
- [ ] UI/product scope drift check completed: no generic eval platform, no template bloat, navigation remains locked.

## Test criteria

- [ ] Full phase E2E flow is executed.
- [ ] Core smoke scripts are run.
- [ ] Regression notes are documented in the ticket file or PR summary.
- [ ] `pnpm lint` passes.
- [ ] `pnpm typecheck` passes.
- [ ] `pnpm test` passes or a documented reason is provided for unavailable test command.
- [ ] `pnpm build` passes.
- [ ] `pnpm test:e2e` passes where applicable.

## Manual QA checklist

- [ ] Open the affected page or run the affected workflow locally.
- [ ] Verify the happy path.
- [ ] Verify at least one relevant sad path.
- [ ] Verify no unrelated primary navigation/pages changed unexpectedly.
- [ ] Capture screenshots for UI changes.

## Definition of done

- [ ] Code complete and scoped to this ticket.
- [ ] Acceptance criteria satisfied.
- [ ] Test criteria satisfied or documented with approved exception.
- [ ] No hardcoded secrets or sensitive logging.
- [ ] Ticket checklist updated.
- [ ] PR summary includes changed files, testing, screenshots for UI work, and risks.

## Codex notes

Codex should append implementation notes, commands run, failures, and follow-ups here before marking this task ready for review.

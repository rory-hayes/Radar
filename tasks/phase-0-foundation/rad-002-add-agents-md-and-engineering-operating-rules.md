# RAD-002 — Add AGENTS.md and engineering operating rules

## Status

Done

## Priority

P0

## Phase

Phase 0 — Foundation (MVP)

## Objective

Add the repository-level instructions Codex must follow on every task, including scope control, no unrelated refactors, no mock production data, tests-first discipline, and status updates.

## Target outcome

Codex can read the repo instructions and every future task references them as mandatory guidance.

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

RAD-001 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

package/config/app shell/docs/test files as required by the task.

## Acceptance criteria

- [x] The implemented behavior matches the objective and outcome.
- [x] The implementation fits Radar's assertion-led model.
- [x] The UI/API handles success, loading, empty, and error states where relevant. No UI/API behavior changed in this docs-only ticket.
- [x] Data persists correctly where applicable. No persistence path changed in this docs-only ticket.
- [x] Workspace authorization is enforced where applicable. No authorization path changed in this docs-only ticket.
- [x] No unrelated scope is introduced.

## Test criteria

- [x] Relevant unit and integration tests are added or updated. No new tests were required for the docs/process-only change; existing tests passed.
- [x] Manual QA steps are documented in the PR summary.
- [x] No existing E2E smoke flow is broken.
- [x] `pnpm lint` passes.
- [x] `pnpm typecheck` passes.
- [x] `pnpm test` passes or a documented reason is provided for unavailable test command.
- [x] `pnpm build` passes.
- [x] `pnpm test:e2e` passes where applicable.

## Manual QA checklist

- [x] Open the affected page or run the affected workflow locally. Reviewed the affected workflow docs and task board locally.
- [x] Verify the happy path. Confirmed tickets are marked Done and Codex continues to the next numeric ticket after checks pass.
- [x] Verify at least one relevant sad path. Confirmed failed checks, failed E2E gates, ambiguous scope, missing credentials, and required product decisions still stop progress.
- [x] Verify no unrelated primary navigation/pages changed unexpectedly. No app navigation or product routes changed.
- [x] Capture screenshots for UI changes. Not applicable; no UI changed.

## Definition of done

- [x] Code complete and scoped to this ticket.
- [x] Acceptance criteria satisfied.
- [x] Test criteria satisfied or documented with approved exception.
- [x] No hardcoded secrets or sensitive logging.
- [x] Ticket checklist updated.
- [x] PR summary includes changed files, testing, screenshots for UI work, and risks.

## Codex notes

Implemented the RAD-002 operating-rule update:

- Removed the per-ticket Review status from `tasks/TASKS.md`.
- Updated `AGENTS.md`, `tasks/CODEX_WORKFLOW.md`, `docs/OPERATING_MODEL.md`, setup docs, kickoff prompts, and the task template so Codex marks tickets Done after criteria and checks pass, then continues to the next numeric ticket.
- Preserved E2E gates as required quality gates. Codex still stops when a gate fails, scope is ambiguous, credentials are missing, or a required product decision is blocked.
- Replaced the repeated review-ready ticket boilerplate with Done-oriented wording across existing RAD ticket files.

Commands run:

- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm test` — passed, 4 unit tests.
- `pnpm test:e2e` — passed, 3 smoke tests.
- `pnpm build` — passed. Next.js still logs the local macOS native SWC code-signature warning and falls back to WASM, which is the same known local behavior from RAD-001.
- `git diff --check` — passed.

Follow-ups:

- Continue with RAD-003 on the next focused branch after this ticket is committed.

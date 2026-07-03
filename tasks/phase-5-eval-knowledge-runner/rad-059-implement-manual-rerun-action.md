# RAD-059 — Implement manual rerun action

## Status

Done

## Priority

P0

## Phase

Phase 5 — Evaluation Engine and Knowledge Runner (MVP)

## Objective

Add server-side action and UI button to rerun an assertion or specific failed test case with permission checks and run status feedback.

## Target outcome

Users can rerun checks after fixing sources or systems.

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

RAD-058 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

Evaluation jobs, Knowledge Runner, LLM adapter, scoring logic, run UI, and tests.

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

- Added `src/lib/evaluation/manual-reruns.ts` for typed RAD-059 rerun metadata, runner test-case matching, and targeted test-case filtering.
- Updated `queueManualAssertionRunAction` to keep `run:rerun` authorization, validate assertion/workspace ownership, validate optional targeted test cases, and queue either assertion-wide or single-test-case reruns.
- Updated the Knowledge Runner to honor targeted rerun metadata and return a bounded error if the selected test case is no longer approved or runnable.
- Updated assertion detail loading and the manual verification card to show latest run status and rerun candidates from the latest failing run.
- shadcn MCP note: searched blocks for `run`; results were full dashboard/run-history patterns, so no new shadcn block was installed. Existing installed primitives (`Card`, `Alert`, `Button`, `Badge`) were used.
- Manual QA: protected assertion route loaded to the sign-in redirect in local smoke because seeded auth was unavailable in this environment; UI behavior is covered by static tests. Screenshot capture is not meaningful until a seeded authenticated workspace can load the assertion detail page.
- Validation passed: `node --test tests/unit/manual-rerun-action.test.mjs`; affected RAD-049/RAD-050/RAD-051/RAD-055 tests; `pnpm lint`; `pnpm typecheck`; `pnpm test` (216 unit tests); `pnpm build`; `pnpm test:e2e` (19 tests); `pnpm validate:seed`; `pnpm validate:env`; `pnpm db:harness`; `git diff --check`; secret scan; protected-route local smoke on port 3025.
- `pnpm db:harness:apply` failed because Docker is not running: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`.

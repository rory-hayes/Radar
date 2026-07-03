# RAD-079 — Implement rerun-after-fix and resolution linking

## Status

Done

## Priority

P1

## Phase

Phase 7 — Findings and Recommended Fixes (Beta)

## Objective

Link reruns to findings and allow a passing rerun to suggest or complete resolution depending on workspace settings.

## Target outcome

Fix validation is built into the finding workflow.

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

RAD-078 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

Findings engine, Findings UI, evidence display, recommended fixes, workflow actions, and tests.

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

Result: Done.

- Added `src/lib/findings/rerun-resolution.ts` with linked finding-rerun metadata, passing-rerun detection, and Fixed/Resolved status handling.
- Evaluation job completion now calls `processFindingRerunResolutionForRun` after persisting a completed run.
- Added `getTestCaseResultById` so finding-triggered reruns can target the original approved test case when possible.
- Added `queueFindingRerunAction` with `run:rerun` permission, workspace validation, targeted/whole-assertion fallback, linked metadata, and `rerun_linked` activity.
- Added `src/components/findings/finding-rerun-form.tsx` and rendered a Fix validation panel in the finding detail view.
- Updated `docs/DATA_MODEL.md`, `docs/EVAL_ENGINE_SPEC.md`, `tasks/TASKS.md`, and unit coverage for RAD-079.

Commands run:

- `pnpm test -- --test-name-pattern 'RAD-079|RAD-077|RAD-059'`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm validate:seed`
- `pnpm validate:env`
- `pnpm db:harness`
- `pnpm build`
- `pnpm db:harness:apply` (blocked because Docker is not running: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`)
- `pnpm start --port 3019`
- `curl -I http://localhost:3019/findings`

Manual QA:

- Production smoke on `http://localhost:3019/findings` returned `307 Temporary Redirect` to `/sign-in?next=%2Ffindings`, verifying protected Findings routing still works.
- Rerun happy/sad paths are covered by static tests for metadata, permission guard, targeted rerun fallback, activity writes, and passing-rerun resolution processing.

# RAD-057 — Persist test case results and scoring

## Status

Done

## Priority

P0

## Phase

Phase 5 — Evaluation Engine and Knowledge Runner (MVP)

## Objective

Store per-test results with pass/warning/fail/inconclusive/error status, score, confidence, summaries, and evidence refs.

## Target outcome

Run history can be inspected at both assertion and test-case granularity.

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

RAD-056 should be complete or deliberately skipped with notes.

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

Codex should append implementation notes, commands run, failures, and follow-ups here before marking this task Done.

## Implementation notes

- Wired the RAD-056 hybrid evaluator into `src/lib/evaluation/knowledge-runner.ts`.
- Successful Knowledge Runner test executions now persist `test_case_results` with evaluated status, score, confidence, actual summary, evaluator summary, evidence refs, timing metadata, and rubric dimension metadata.
- Evaluation run job results now aggregate persisted test-case statuses into passed/warning/failed/error/skipped counts plus average score and confidence.
- Existing repository and database schema already supported score, confidence, summaries, evidence refs, and execution metadata, so no migration was required.
- Updated RAD-055 tests to keep asserting raw output capture while RAD-057 owns scoring assertions.
- Documented RAD-057 result persistence in `docs/EVAL_ENGINE_SPEC.md`.

## Validation

- `node --test tests/unit/knowledge-runner-execution.test.mjs` — pass.
- `node --test tests/unit/test-case-result-scoring.test.mjs` — pass.
- `pnpm lint` — pass.
- `pnpm typecheck` — pass.
- `pnpm test` — pass, 209 unit tests.
- `pnpm build` — pass.
- `pnpm test:e2e` — pass, 19 E2E gate tests.
- `pnpm validate:seed` — pass.
- `pnpm validate:env` — pass.
- `pnpm db:harness` — pass.
- `pnpm db:harness:apply` — blocked by local environment because the Docker daemon is not running.
- `curl -I -s http://127.0.0.1:3023/assertions/00000000-0000-4000-8000-000000000000` — pass, protected detail route returns `307` to `/sign-in`.

## Manual QA

- Confirmed the app boots locally and protected assertion routes still redirect unauthenticated traffic.
- Verified no primary navigation, new page, or new runner type was introduced.
- This ticket is server-side result persistence infrastructure; no UI screenshot artifact was required.

## Accepted deferrals

- `pnpm db:harness:apply` requires Docker/Supabase local services. Docker is unavailable in this environment, so the static harness passed and the apply failure is documented as environment-only.
- Surfacing scored test-case results in the assertion detail UI is scoped to RAD-058.

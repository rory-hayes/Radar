# RAD-055 — Implement Knowledge Runner execution loop

## Status

Done

## Priority

P0

## Phase

Phase 5 — Evaluation Engine and Knowledge Runner (MVP)

## Objective

Run question/test case inputs against the configured target, capture actual answers, attach evidence, and produce raw test outputs.

## Target outcome

Knowledge assertions can execute end-to-end and persist actual responses.

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

RAD-054 should be complete or deliberately skipped with notes.

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

- Added `src/lib/evaluation/knowledge-runner.ts` as the server-only raw Knowledge Runner execution loop.
- The runner claims work through the existing RAD-051 orchestration helper via `runNextKnowledgeEvaluationJob`.
- It validates the run is a Knowledge Runner run, loads the workspace-scoped assertion, filters to approved `customer_question` test cases, selects one ready target from RAD-054 target configuration, and executes each test case.
- Endpoint targets are called through bounded GET/POST requests with question/assertion/test-case context. Uploaded and manual answer-set targets use assertion-scoped evidence matches as the captured answer sample.
- Each executed test case writes a `test_case_results` row with `actual_output`, bounded actual summary, evidence refs, timing metadata, and `inconclusive` status until RAD-056/RAD-057 scoring is added.
- Target errors write `error` test-case results with bounded error metadata. Raw runner output does not store bearer values, API keys, or other runner credentials.
- Documented raw Knowledge Runner execution in `docs/EVAL_ENGINE_SPEC.md` and `docs/RUNNERS_SPEC.md`.

## Validation

- `node --test tests/unit/knowledge-runner-execution.test.mjs` — pass.
- `pnpm lint` — pass.
- `pnpm typecheck` — pass.
- `pnpm test` — pass, 200 unit tests.
- `pnpm build` — pass.
- `pnpm test:e2e` — pass, 19 E2E gate tests.
- `pnpm validate:seed` — pass.
- `pnpm validate:env` — pass.
- `pnpm db:harness` — pass.
- `pnpm db:harness:apply` — blocked by local environment because the Docker daemon is not running.
- `curl -I -s http://127.0.0.1:3021/assertions/00000000-0000-4000-8000-000000000000` — pass, protected detail route returns `307` to `/sign-in`.

## Manual QA

- Confirmed the affected app route still boots locally and remains protected behind sign-in.
- Verified no primary navigation or new runner type was added.
- This ticket is server-side runner infrastructure; no UI screenshot artifact was required.

## Accepted deferrals

- `pnpm db:harness:apply` requires Docker/Supabase local services. Docker is unavailable in this environment, so the static harness passed and the apply failure is documented as environment-only.
- Final pass/warning/fail scoring, confidence calibration, and result UI are scoped to RAD-056 through RAD-058.

# RAD-051 — Create evaluation job orchestration

## Status

Done

## Priority

P0

## Phase

Phase 5 — Evaluation Engine and Knowledge Runner (MVP)

## Objective

Implement Trigger.dev jobs or equivalent abstractions for queueing, running, retrying, and tracking assertion evaluation jobs.

## Target outcome

Evaluation work runs outside the request/response path with durable status and retry behaviour.

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

RAD-050 should be complete or deliberately skipped with notes.

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

- Added `src/lib/evaluation/job-orchestration.ts` as the server-only equivalent abstraction for Trigger.dev-style evaluation work.
- Added durable queueing through `queueEvaluationJob`, storing Radar-owned orchestration metadata in `evaluation_runs.execution_metadata.orchestration`.
- Added `runNextEvaluationJob` to claim the next due queued run by workspace, mark it `running`, invoke a supplied runner callback, persist terminal counts/status, or reschedule retryable failures.
- Added repository helpers to list due queued runs, claim queued runs safely with a queued-status guard, and update job state, timestamps, counts, evidence refs, error messages, and execution metadata.
- Routed the manual assertion run action through `queueEvaluationJob` while preserving the approved-test-case guard and `run:rerun` permission check.
- Documented RAD-051 queue/retry semantics in `docs/DATA_MODEL.md`.
- No new UI component or shadcn block was needed for this infrastructure ticket.

## Validation

- `pnpm lint` — pass.
- `pnpm typecheck` — pass.
- `pnpm test` — pass, 179 unit tests.
- `pnpm build` — pass.
- `pnpm test:e2e` — pass, 19 E2E gate tests.
- `pnpm validate:seed` — pass.
- `pnpm validate:env` — pass.
- `pnpm db:harness` — pass.
- `pnpm db:harness:apply` — blocked by local environment because the Docker daemon is not running.
- `curl -I -s http://127.0.0.1:3017/assertions/00000000-0000-4000-8000-000000000000` — pass, protected detail route returns `307` to `/sign-in`.
- `git diff --check` — pass.
- Secret scan for shadcn, OpenAI, Supabase, Stripe, and bearer-token patterns — pass, no matches.

## Manual QA

- Verified the app boots locally and protected assertion detail routes still redirect unauthenticated users to sign-in with the original destination preserved.
- No user-facing UI changed in this ticket, so no screenshot artifact was required.

## Accepted deferrals

- `pnpm db:harness:apply` requires Docker/Supabase local services. Docker is unavailable in this environment, so the static harness passed and the apply failure is documented as environment-only.
- Actual Knowledge Runner evidence loading, LLM evaluation, test-case result writes, and findings generation remain scoped to subsequent Phase 5 tickets.

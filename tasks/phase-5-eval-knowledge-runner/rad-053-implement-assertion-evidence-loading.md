# RAD-053 — Implement assertion evidence loading

## Status

Done

## Priority

P0

## Phase

Phase 5 — Evaluation Engine and Knowledge Runner (MVP)

## Objective

Before each test, retrieve relevant evidence chunks and source snapshots based on assertion/test case context.

## Target outcome

Every evaluation has grounded evidence available before judging begins.

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

RAD-052 should be complete or deliberately skipped with notes.

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

- Added `src/lib/evaluation/evidence-loading.ts` as the server-only pre-judge evidence loader.
- The loader validates workspace-scoped assertion and test-case ownership, rejects test cases from other assertions, and restricts optional source filters to assertion-linked sources.
- It builds a test-case-specific evidence query from assertion title, expected behavior, test-case input, and expected result.
- It reuses `retrieveEvidenceForAssertion` instead of creating a generic workspace search surface.
- It maps bounded evidence matches into evaluation evidence refs and attaches latest source-version/document snapshots for explainability.
- Documented the RAD-053 evidence-loading contract in `docs/EVAL_ENGINE_SPEC.md`.
- No new UI component or shadcn block was needed for this server-only infrastructure ticket.

## Validation

- `node --test tests/unit/evaluation-evidence-loading.test.mjs tests/unit/evidence-retrieval-api.test.mjs` — pass.
- `pnpm lint` — pass.
- `pnpm typecheck` — pass.
- `pnpm test` — pass, 190 unit tests.
- `pnpm build` — pass.
- `pnpm test:e2e` — pass, 19 E2E gate tests.
- `pnpm validate:seed` — pass.
- `pnpm validate:env` — pass.
- `pnpm db:harness` — pass.
- `pnpm db:harness:apply` — blocked by local environment because the Docker daemon is not running.
- `curl -I -s http://127.0.0.1:3019/assertions/00000000-0000-4000-8000-000000000000` — pass, protected detail route returns `307` to `/sign-in`.
- `git diff --check` — pass.
- Secret scan for shadcn, OpenAI, Supabase, Stripe, and bearer-token patterns — pass, no matches.

## Manual QA

- This ticket has no new user-facing UI. Manual QA covered local app smoke and no-scope-drift verification.
- No screenshot artifact was required because no UI changed.

## Accepted deferrals

- `pnpm db:harness:apply` requires Docker/Supabase local services. Docker is unavailable in this environment, so the static harness passed and the apply failure is documented as environment-only.
- Actual Knowledge Runner execution, target answer capture, LLM judging, and test-case result persistence remain scoped to subsequent Phase 5 tickets.

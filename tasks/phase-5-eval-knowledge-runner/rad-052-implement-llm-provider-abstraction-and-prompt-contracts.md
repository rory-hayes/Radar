# RAD-052 — Implement LLM provider abstraction and prompt contracts

## Status

Done

## Priority

P0

## Phase

Phase 5 — Evaluation Engine and Knowledge Runner (MVP)

## Objective

Create a server-only LLM adapter for generation, judging, summarization, and fix recommendations with strict prompt/version logging.

## Target outcome

No OpenAI keys or model configuration leak to the client and prompts are versioned.

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

RAD-051 should be complete or deliberately skipped with notes.

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

- Added `src/lib/llm/openai-responses.ts` as the shared server-only OpenAI Responses JSON provider.
- Added `src/lib/llm/prompt-contracts.ts` for versioned prompt contracts and redacted prompt-call metadata with SHA-256 input fingerprints.
- Added Phase 5 prompt contracts for judging, summarization, and fix recommendations in `src/lib/evaluation/llm-prompt-contracts.ts`.
- Migrated assertion and test-case suggestion providers to the shared adapter while preserving their domain-specific provider APIs and errors.
- Generated assertion and test-case metadata now records prompt id and prompt version alongside model and source context.
- Documented the LLM prompt/version logging contract in `docs/EVAL_ENGINE_SPEC.md`.
- No new UI component or shadcn block was needed for this server-only infrastructure ticket.

## Validation

- `node --test tests/unit/llm-provider-contracts.test.mjs tests/unit/assertion-ai-suggestions.test.mjs tests/unit/ai-test-case-generator.test.mjs` — pass.
- `pnpm lint` — pass.
- `pnpm typecheck` — pass.
- `pnpm test` — pass, 184 unit tests.
- `pnpm build` — pass.
- `pnpm test:e2e` — pass, 19 E2E gate tests.
- `pnpm validate:seed` — pass.
- `pnpm validate:env` — pass.
- `pnpm db:harness` — pass.
- `pnpm db:harness:apply` — blocked by local environment because the Docker daemon is not running.
- `curl -I -s http://127.0.0.1:3018/assertions/00000000-0000-4000-8000-000000000000` — pass, protected detail route returns `307` to `/sign-in`.
- `git diff --check` — pass.
- Secret scan for shadcn, OpenAI, Supabase, Stripe, and bearer-token patterns — pass, no matches.

## Manual QA

- This ticket has no new user-facing UI. Manual QA covered local app smoke and no-scope-drift verification.
- No screenshot artifact was required because no UI changed.

## Accepted deferrals

- Actual Knowledge Runner judging, summarization persistence, recommended fix generation, and Langfuse tracing remain scoped to later Phase 5 and production-readiness tickets.

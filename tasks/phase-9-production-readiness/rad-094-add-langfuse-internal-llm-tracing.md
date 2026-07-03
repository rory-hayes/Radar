# RAD-094 — Add Langfuse internal LLM tracing

## Status

Done

## Priority

P0

## Phase

Phase 9 — Production Readiness (Production)

## Objective

Instrument internal LLM calls for assertion generation, test case generation, judging, and fixes with prompt versions, costs, latency, and redacted metadata.

## Target outcome

LLM behaviour is observable internally without exposing trace complexity to customers.

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

RAD-093 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

Billing, onboarding, observability, security, performance, deployment docs, and tests.

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

## Codex implementation notes

- Added Langfuse JS tracing dependencies and registered a Node OpenTelemetry tracer provider with `LangfuseSpanProcessor` when `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` are configured.
- Wrapped the shared OpenAI Responses JSON provider so assertion generation, test case generation, and hybrid evaluator judging emit internal `radar.llm.*` generation observations.
- Recorded prompt id, prompt version, task, response format, provider, model, input/output fingerprints, latency, usage details, trace id, and observation id. Token usage plus model name lets Langfuse infer model costs without hardcoding pricing in Radar.
- Kept raw prompts, source content, evidence chunks, runner outputs, completions, credentials, cookies, and request bodies out of Langfuse metadata. Added a span masking function as a second export boundary.
- Left the recommended-fix generator deterministic per RAD-076, while preserving the versioned `recommendedFixPromptContract` for future traced LLM use.
- Updated `docs/OBSERVABILITY.md` and added `tests/unit/langfuse-llm-tracing.test.mjs`.

## Validation

- `pnpm lint` passed.
- `pnpm typecheck` passed.
- `pnpm test` passed: 357 unit tests.
- `pnpm build` passed.
- `pnpm test:e2e` passed: 34 E2E tests.
- `pnpm db:harness:apply` failed because Docker is unavailable locally: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`

## Manual QA

- No customer-facing UI was added, so screenshots are not applicable.
- Verified the happy path through unit/build coverage: configured Langfuse credentials start tracing and provider calls attach redacted generation metadata.
- Verified the sad path in code and tests: missing Langfuse credentials skip tracing while LLM calls continue, and trace startup failure returns a skipped trace boundary rather than breaking the OpenAI request.
- Verified primary navigation remained unchanged through the existing E2E gates.

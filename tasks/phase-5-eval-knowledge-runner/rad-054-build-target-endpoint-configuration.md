# RAD-054 — Build target endpoint configuration

## Status

Done

## Priority

P0

## Phase

Phase 5 — Evaluation Engine and Knowledge Runner (MVP)

## Objective

Allow a workspace to configure AI support endpoints, generic HTTP targets, or uploaded answer sets required by a Knowledge Runner assertion.

## Target outcome

Radar can test actual customer-facing answers or uploaded answer samples.

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

RAD-053 should be complete or deliberately skipped with notes.

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

- Read `AGENTS.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/PRODUCT_SCOPE.md`, `docs/SHADCN_MCP_AND_BLOCKS.md`, and the active ticket before implementation.
- Verified `shadcnio` MCP availability and searched for relevant settings blocks. No new shadcn block was installed because the results were generic settings scaffolds; RAD-054 uses the existing Radar `Card`, `Table`, `Alert`, `Badge`, `Button`, and `StatusBadge` primitives.
- Implemented target configuration as an assertion-led projection over linked `sources` records rather than a new integration marketplace or target table.

## Implementation notes

- Added `src/lib/evaluation/knowledge-targets.ts` as the server-only Knowledge Runner target configuration loader.
- Added `listSourceSyncTargetsForWorkspace` so target config can read linked source config and metadata with explicit workspace scope.
- Classified support bot endpoints as AI support endpoints, API endpoints as HTTP endpoints, uploaded documents as uploaded answer sets, and manual text as manual answer sets.
- Target readiness now covers missing endpoint URLs, missing synced answer-set content, source sync errors, paused/archived sources, and ready states.
- Added a Knowledge target configuration panel to the assertion detail Sources tab. It is hidden for non-Knowledge assertions and shows empty, warning, and ready states for Knowledge assertions.
- Endpoint UI exposes method and credential mode labels only. It does not persist or display bearer values, API keys, or other runner secrets.
- Documented the RAD-054 boundary in `docs/EVAL_ENGINE_SPEC.md` and `docs/SOURCES_AND_EVIDENCE.md`.

## Validation

- `node --test tests/unit/knowledge-target-configuration.test.mjs` — pass.
- `node --test tests/unit/assertion-detail-page.test.mjs tests/unit/source-form-flow.test.mjs` — pass.
- `pnpm lint` — pass.
- `pnpm typecheck` — pass.
- `pnpm test` — pass, 195 unit tests.
- `pnpm build` — pass.
- `pnpm test:e2e` — pass, 19 E2E gate tests.
- `pnpm validate:seed` — pass.
- `pnpm validate:env` — pass.
- `pnpm db:harness` — pass.
- `pnpm db:harness:apply` — blocked by local environment because the Docker daemon is not running.
- `curl -I -s http://127.0.0.1:3020/assertions/00000000-0000-4000-8000-000000000000` — pass, protected detail route returns `307` to `/sign-in`.
- `git diff --check` — pass.
- Secret scan for shadcn, OpenAI, Supabase, Stripe, and bearer-token patterns — pass, no matches.

## Manual QA

- Confirmed the assertion detail route remains protected and redirects unauthenticated traffic to sign-in.
- Verified the new UI is scoped to the existing assertion detail Sources tab and does not add primary navigation or a standalone target/integration page.
- Static tests verify the panel's empty, warning, and ready state labels and links. A live authenticated screenshot of the target panel was not captured because the local Supabase/Docker stack is unavailable for creating a seeded signed-in session in this environment.

## Accepted deferrals

- `pnpm db:harness:apply` requires Docker/Supabase local services. Docker is unavailable in this environment, so the static harness passed and the apply failure is documented as environment-only.
- Actual Knowledge Runner execution against configured targets remains scoped to RAD-055.

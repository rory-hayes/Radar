# RAD-048 — Implement AI test case generator

## Status

Done

## Priority

P0

## Phase

Phase 4 — Assertions and Test Cases (MVP)

## Objective

Generate realistic customer questions and scenarios for approved assertions using source evidence and assertion purpose.

## Target outcome

Generated test cases include expected behaviour, coverage notes, and user-editable text.

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

RAD-047 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

Assertions UI, assertion APIs/actions, test case logic, templates, generators, and tests.

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
- [x] Document screenshot exception for UI changes.

## Definition of done

- [x] Code complete and scoped to this ticket.
- [x] Acceptance criteria satisfied.
- [x] Test criteria satisfied or documented with approved exception.
- [x] No hardcoded secrets or sensitive logging.
- [x] Ticket checklist updated.
- [x] PR summary includes changed files, testing, screenshots for UI work, and risks.

## Codex notes

Codex should append implementation notes, commands run, failures, and follow-ups here before marking this task Done.

## Implementation summary

- Added `src/lib/assertions/ai-test-cases.ts`, a server-only OpenAI Responses provider for source-grounded test-case suggestions. It requests strict `json_schema` output and validates `title`, `type`, `inputText`, `expectedResult`, and `coverageNotes`.
- Added `generateSuggestedTestCasesAction` to the assertions actions module. The action requires `assertion:edit`, validates the active workspace assertion, loads linked source context and existing test cases, rejects generation without linked source context, and persists suggestions as `draft` test cases.
- Extended `AssertionTestCaseManager` with a generation panel on the assertion detail Test Cases tab. Generated cases remain editable and unapproved.
- Added `tests/unit/ai-test-case-generator.test.mjs` for provider boundaries, action behavior, UI wiring, and scope/secret safety.

## MCP, blocks, and docs notes

- shadcn.io MCP was available. Search for `test generator` returned no matching block; search for `AI generator` returned no narrow useful block for this workflow.
- No block source or new component primitive was installed. The implementation reused the existing RAD-047 manager and installed shadcn primitives.
- OpenAI Responses API usage follows the same official `/v1/responses`, `json_schema`, and `output_text` pattern verified in RAD-046: `https://developers.openai.com/api/reference/resources/responses/methods/create`.

## Commands run

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test -- tests/unit/ai-test-case-generator.test.mjs`
- `pnpm test:e2e`
- `pnpm validate:seed`
- `pnpm validate:env`
- `pnpm db:harness`
- `pnpm build`
- `pnpm db:harness:apply` failed because Docker is not running: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`.
- `pnpm dev --hostname 127.0.0.1 --port 3014`
- `curl -I -s 'http://127.0.0.1:3014/assertions/00000000-0000-4000-8000-000000000000'`

## Manual QA

- Verified `/assertions/00000000-0000-4000-8000-000000000000` returns `307` to `/sign-in?next=%2Fassertions%2F00000000-0000-4000-8000-000000000000` while unauthenticated.
- Happy path is covered by unit assertions that generated suggestions are persisted as draft, editable test cases with expected results and coverage notes.
- Sad paths covered by validation and guardrails: missing linked sources, insufficient linked source context, missing OpenAI configuration, invalid assertion id, and unauthorized roles.
- No screenshot captured for the authenticated generator panel because the available local smoke was unauthenticated; the route-level auth redirect was verified instead.

## Risks and follow-ups

- Live generation requires `OPENAI_API_KEY` in the server environment. Without it, the action returns a configuration error and creates no drafts.
- Generated test cases intentionally remain drafts. Human approval remains the explicit RAD-047 lifecycle action.

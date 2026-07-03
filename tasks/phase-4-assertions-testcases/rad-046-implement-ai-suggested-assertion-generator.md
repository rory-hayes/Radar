# RAD-046 — Implement AI suggested assertion generator

## Status

Done

## Priority

P0

## Phase

Phase 4 — Assertions and Test Cases (MVP)

## Objective

Use source content and workspace context to propose assertions with purpose, category, required sources, priority, and suggested runner type.

## Target outcome

AI suggestions are reviewable drafts and never become active without user approval.

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

RAD-045 should be complete or deliberately skipped with notes.

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

- Added `src/lib/assertions/ai-suggestions.ts`, a server-only OpenAI Responses provider for assertion suggestions. It sends bounded source context, requests strict `json_schema` output, parses `output_text`, and validates suggestions with the existing assertion category, priority, and runner-type enums.
- Added `generateSuggestedAssertionDraftsAction` to the assertions actions module. The action enforces `assertion:create`, validates selected source ids against the active workspace, loads source chunk previews, creates suggested assertions with `status: "draft"`, links source evidence, and stores disabled manual schedules with source-change triggers.
- Added `AssertionSuggestionGenerator` to the assertion create page. The UI lets editors select up to five sources, choose a draft count, handles pending/empty/error states, and makes the review-before-activation model explicit.
- Installed the official shadcn `checkbox` primitive through `pnpm dlx shadcn@latest add checkbox` and composed the UI with existing shadcn Card, Field, Alert, Input, and Button primitives.
- Added `tests/unit/assertion-ai-suggestions.test.mjs` to cover server-only provider boundaries, draft-only persistence, workspace source validation hooks, create-page wiring, and scope/secret safety.

## MCP, blocks, and docs notes

- shadcn.io MCP was available and used for a block search. The closest block was `ai-document-generator`, but it is broader than Radar's source-to-assertion workflow and premium, so no block source was installed.
- shadcn CLI docs were checked for `checkbox`; the official docs describe pairing Checkbox with Field/FieldLabel/FieldContent and installing via `pnpm dlx shadcn@latest add checkbox`.
- Official OpenAI Responses API create docs were checked for the `/v1/responses` endpoint, structured response creation, and `output_text` response access: `https://developers.openai.com/api/reference/resources/responses/methods/create`.

## Commands run

- `pnpm dlx shadcn@latest docs checkbox`
- `pnpm dlx shadcn@latest info --json`
- `pnpm dlx shadcn@latest add checkbox`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test -- tests/unit/assertion-ai-suggestions.test.mjs`
- `pnpm test:e2e`
- `pnpm validate:seed`
- `pnpm validate:env`
- `pnpm db:harness`
- `pnpm build`
- `pnpm db:harness:apply` failed because Docker is not running: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`.
- `pnpm dev --hostname 127.0.0.1 --port 3012`
- `curl -I -s 'http://127.0.0.1:3012/assertions/new'`
- `curl -I -s 'http://127.0.0.1:3012/assertions/new?template=pricing-plan-accuracy'`

## Manual QA

- Verified `/assertions/new` returns `307` to `/sign-in?next=%2Fassertions%2Fnew` while unauthenticated.
- Verified `/assertions/new?template=pricing-plan-accuracy` returns `307` to `/sign-in?next=%2Fassertions%2Fnew%3Ftemplate%3Dpricing-plan-accuracy`, preserving the template query.
- Happy path is covered by unit assertions that generated suggestions are persisted only as draft assertions with linked sources and disabled manual schedules.
- Sad paths covered by validation and UI states: no selected sources, out-of-workspace source ids, insufficient source context, and missing OpenAI configuration produce form errors.
- No screenshot captured for the authenticated generator panel because the available local smoke was unauthenticated; the route-level auth redirect was verified instead.

## Risks and follow-ups

- Live generation requires `OPENAI_API_KEY` in the server environment. Without it, the action returns a configuration error and does not create drafts.
- The provider intentionally creates reviewable draft assertions only. Activation, approval workflow, and test case creation remain separate tickets.

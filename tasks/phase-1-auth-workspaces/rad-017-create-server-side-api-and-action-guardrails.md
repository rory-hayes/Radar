# RAD-017 — Create server-side API and action guardrails

## Status

Done

## Priority

P0

## Phase

Phase 1 — Auth and Workspaces (MVP)

## Objective

Standardize server actions/API handlers with auth, workspace resolution, input validation, error mapping, and response conventions.

## Target outcome

New backend endpoints follow one secure pattern and cannot skip workspace authorization.

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

RAD-016 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

- `src/lib/server/guardrails.ts`
- `src/app/(workspace)/workspace/new/actions.ts`
- `src/app/(app)/settings/actions.ts`
- `docs/SECURITY.md`
- `docs/ARCHITECTURE.md`
- `tests/unit/server-guardrails.test.mjs`
- `tasks/TASKS.md`
- `tasks/phase-1-auth-workspaces/rad-017-create-server-side-api-and-action-guardrails.md`

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

- Implemented `src/lib/server/guardrails.ts` as the server-only entrypoint convention for authenticated server actions, workspace server actions, authenticated JSON API handlers, and workspace JSON API handlers.
- Standardized responses around `{ ok, data }` and `{ ok, code, error }`, with Zod validation errors, unauthenticated errors, missing-workspace errors, permission errors, and generic server errors mapped consistently.
- Refactored first-workspace creation and workspace settings actions to use the guardrails instead of hand-rolled Zod/error handling.
- Documented the mutation-entrypoint rule in `docs/SECURITY.md` and the architecture-level guardrail layer in `docs/ARCHITECTURE.md`.
- Added `tests/unit/server-guardrails.test.mjs` to lock down auth, workspace membership, permission, validation, response, and action-refactor conventions.
- Manual QA: this ticket has no UI changes. Verified the existing action workflows through unit coverage and confirmed the app build still includes the existing `/workspace/new`, `/settings`, and primary navigation routes without introducing new product pages.
- Commands run:
  - `pnpm lint`
  - `pnpm test`
  - `pnpm validate:env`
  - `pnpm validate:seed`
  - `pnpm typecheck`
  - `pnpm test:e2e`
  - `pnpm build`
- Screenshots: not applicable; no UI surface changed.
- Risks/follow-ups: future source, assertion, run, and finding mutations should use `runWorkspaceServerAction(...)` or `runWorkspaceApiHandler(...)` as they are introduced.

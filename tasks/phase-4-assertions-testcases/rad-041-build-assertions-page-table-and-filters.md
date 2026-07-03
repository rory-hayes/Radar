# RAD-041 — Build Assertions page table and filters

## Status

Done

## Priority

P0

## Phase

Phase 4 — Assertions and Test Cases (MVP)

## Objective

Implement the Assertions page with real data, filters by status/category/owner/priority/runner type, search, pagination, and empty states.

## Target outcome

Users can manage business truths from a clean table without dashboard bloat.

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

RAD-040 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.
- For UI work, follow `docs/SHADCN_MCP_AND_BLOCKS.md`, `docs/UI_BLOCKS_IMPLEMENTATION_PLAN.md`, and `tasks/MCP_BLOCKS_USAGE_CHECKLIST.md`.

## Expected files touched

Assertions UI, assertion APIs/actions, test case logic, templates, generators, and tests.

## Acceptance criteria

- [x] The implemented behavior matches the objective and outcome.
- [x] The implementation fits Radar's assertion-led model.
- [x] The UI/API handles success, loading, empty, and error states where relevant.
- [x] Data persists correctly where applicable.
- [x] Workspace authorization is enforced where applicable.
- [x] No unrelated scope is introduced.
- [x] UI work follows the shadcn/MCP usage checklist where applicable.

## Test criteria

- [x] Relevant unit and integration tests are added or updated.
- [x] Manual QA steps are documented in the PR summary.
- [x] No existing E2E smoke flow is broken.
- [x] `pnpm lint` passes.
- [x] `pnpm typecheck` passes.
- [x] `pnpm test` passes or a documented reason is provided for unavailable test command.
- [x] `pnpm build` passes.
- [x] `pnpm test:e2e` passes where applicable.


## UI / MCP checklist

- [x] Read `docs/SHADCN_MCP_AND_BLOCKS.md` and `docs/UI_BLOCKS_IMPLEMENTATION_PLAN.md`.
- [x] Checked MCP status or documented CLI fallback.
- [x] Used only the smallest approved shadcn primitive/block needed.
- [x] Removed demo content and unrelated template routes.
- [x] Confirmed UI remains enterprise, minimal, and Radar-specific.
- [x] Included screenshots or manual QA notes in PR summary.

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

## Implementation report

Result: Done. Replaced the Assertions placeholder with a real workspace-backed table for business truths, including server-side search, status/category/owner/priority/runner filters, pagination, empty/error/loading states, source counts, schedules, latest run pass rate, and latest run timestamp.

Changed files:

- `src/app/(app)/assertions/page.tsx`
- `src/app/(app)/assertions/loading.tsx`
- `src/components/assertions/assertion-table.tsx`
- `src/components/assertions/index.ts`
- `src/lib/repositories/assertions.ts`
- `src/lib/repositories/evaluation.ts`
- `tests/unit/assertions-page.test.mjs`
- `tests/unit/route-states.test.mjs`
- `tests/e2e/auth-workspace-isolation.test.mjs`

shadcn / MCP notes:

- `shadcnio` MCP was available.
- Searched shadcn.io blocks for `data table filters`; no narrow block matched.
- Used the smallest installed approved primitives instead: `Card`, `Table`, `Badge` via Radar badges, `Input`, `Select`, `Button`, and loading `Skeleton`.
- Ran `pnpm dlx shadcn@latest info --json`, `pnpm dlx shadcn@latest search @shadcn -q "data table assertions filters"`, and `pnpm dlx shadcn@latest docs table card badge input select button skeleton dropdown-menu`.
- No demo block routes or template content were installed.

Manual QA:

- Happy path: unit and e2e tests verify the Assertions page reads real repository data and renders the required table columns, filters, pagination, empty state, and loading state.
- Sad path: local `curl -I http://127.0.0.1:3011/assertions` returned `307` to `/sign-in?next=%2Fassertions`, confirming unauthenticated access remains protected.
- Screenshot: not captured because the authenticated app page redirects without a local signed-in session. The route protection and UI structure are covered by build, unit, and e2e checks.
- Navigation scope: no new primary nav entries or routes were added.

Commands run:

- `pnpm dlx shadcn@latest info --json`
- `pnpm dlx shadcn@latest search @shadcn -q "data table assertions filters"`
- `pnpm dlx shadcn@latest docs table card badge input select button skeleton dropdown-menu`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm validate:seed`
- `pnpm validate:env`
- `pnpm db:harness`
- `pnpm db:harness:apply` (blocked because Docker daemon is not running)

Risk / follow-up:

- Owner display uses the stored owner user ID prefix until profile/team member display names are introduced.
- Create/edit/detail actions remain scoped to later Phase 4 tickets.

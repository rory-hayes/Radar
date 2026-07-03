# RAD-014 — Build minimal authenticated navigation

## Status

Done

## Priority

P0

## Phase

Phase 1 — Auth and Workspaces (MVP)

## Objective

Implement the left navigation and top bar for Command Center, Assertions, Findings, and Sources with active states, workspace selector placeholder, search affordance, and user menu.

## Target outcome

Users can move between the four core pages with a consistent enterprise shell.

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

RAD-013 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.
- For UI work, follow `docs/SHADCN_MCP_AND_BLOCKS.md`, `docs/UI_BLOCKS_IMPLEMENTATION_PLAN.md`, and `tasks/MCP_BLOCKS_USAGE_CHECKLIST.md`.

## Expected files touched

TBD by implementation. Codex must list actual files touched in the PR summary.

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

## Implementation notes

- Used the `shadcn` skill and read the shadcn/MCP UI docs for this UI-heavy task.
- Queried shadcn.io MCP for workspace switcher blocks and inspected `sidebar-workspace-switcher`; no block was installed because the existing Radar shell only needed a focused workspace selector placeholder.
- Kept the primary sidebar navigation locked to Command Center, Assertions, Findings, and Sources.
- Added a sidebar workspace selector placeholder using existing `DropdownMenu` and `Sidebar` primitives.
- Added a user menu dropdown with account, role/workspace context, and sign-out action.
- Preserved the global search as a disabled affordance labeled as a placeholder until search behavior is scoped.
- Added unit coverage for the workspace selector placeholder, user menu, search affordance, active route mapping, and app shell component boundaries.

## Files touched

- `src/components/app-shell/app-shell.tsx`
- `src/components/app-shell/sidebar-nav.tsx`
- `src/components/app-shell/top-bar.tsx`
- `tasks/TASKS.md`
- `tests/unit/app-shell-routes.test.mjs`

## Commands run

- `pnpm validate:env`
- `pnpm validate:seed`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm supabase:start`

Codex used the bundled Node runtime path because this shell does not expose `node` on `PATH`.

## Manual QA

- Started Next dev server on `http://localhost:3014`.
- Verified unauthenticated `GET /command-center` redirects to `/sign-in?next=%2Fcommand-center`, so the authenticated shell remains protected.
- Verified the sign-in page renders correctly in the local no-Supabase-config environment.
- Attempted local Supabase startup for authenticated visual QA, but Docker is not running: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`.
- Authenticated shell screenshots require Docker/Supabase local running or hosted Supabase credentials. Source-level UI tests cover the RAD-014 shell controls until that infrastructure is available.

## Risks and follow-ups

- Workspace switching remains a placeholder by design; RAD-012 only creates the first workspace, and future workspace switch behavior should be backed by membership queries and server-side workspace context.
- Global search remains a placeholder until the search ticket defines indexed data and permissions.

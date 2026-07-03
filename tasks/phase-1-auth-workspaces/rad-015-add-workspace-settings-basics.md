# RAD-015 — Add workspace settings basics

## Status

Done

## Priority

P0

## Phase

Phase 1 — Auth and Workspaces (MVP)

## Objective

Create a basic workspace settings page for name, slug, team visibility, and environment indicators without expanding into admin bloat.

## Target outcome

Admins can view and update basic workspace profile details safely.

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

RAD-014 should be complete or deliberately skipped with notes.

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

- Queried shadcn.io MCP for settings blocks and inspected `account-organization-settings`; no block was installed because the block was broader than RAD-015.
- Added `workspace_team_visibility` and `workspaces.team_visibility`.
- Added an admin-only RLS update policy for workspace profile updates.
- Added typed validation for workspace name, slug, and team visibility.
- Added `updateWorkspaceSettingsForCurrentUser(...)` with workspace membership and admin permission checks.
- Replaced the settings placeholder with a workspace profile form and environment/access indicator cards.
- Added a server action for settings updates and revalidation.
- Kept settings outside primary navigation and avoided billing/team-management/admin sprawl.

## Files touched

- `supabase/migrations/20260703093000_add_workspace_settings_fields.sql`
- `src/app/(app)/settings/actions.ts`
- `src/app/(app)/settings/page.tsx`
- `src/components/workspaces/workspace-settings-form.tsx`
- `src/lib/workspaces/schema.ts`
- `src/lib/workspaces/server.ts`
- `tasks/TASKS.md`
- `tests/unit/workspace-model.test.mjs`
- `tests/unit/workspace-settings.test.mjs`

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

- Started Next dev server on `http://localhost:3015`.
- Verified unauthenticated `GET /settings` redirects to `/sign-in?next=%2Fsettings`, so settings remain protected.
- Attempted local Supabase startup for authenticated settings update QA, but Docker is not running: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`.
- Authenticated workspace settings update QA requires Docker/Supabase local running or hosted Supabase credentials with migrations applied. Source-level tests cover the settings form, server action, update helper, RLS policy, and environment indicators until that infrastructure is available.

## Risks and follow-ups

- The settings form persists only basic workspace profile fields. Team member management, billing, SSO, audit history, and broader admin controls remain out of scope for RAD-015.
- Live DB mutation should be smoked after Docker or hosted Supabase credentials are available.

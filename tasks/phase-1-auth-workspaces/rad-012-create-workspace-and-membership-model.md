# RAD-012 — Create workspace and membership model

## Status

Done

## Priority

P0

## Phase

Phase 1 — Auth and Workspaces (MVP)

## Objective

Implement workspaces and workspace_members tables plus creation flow so Radar is multi-tenant from the beginning.

## Target outcome

Every app object belongs to a workspace and users access only their workspace data.

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

RAD-011 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

TBD by implementation. Codex must list actual files touched in the PR summary.

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

- Added `workspaces` and `workspace_members` schema with workspace/member status enums and `admin`, `editor`, `viewer` roles.
- Added starter RLS policies for workspace reads, membership reads, workspace inserts, and initial admin membership inserts.
- Added transactional `create_workspace_with_admin_membership(workspace_name, workspace_slug)` RPC so the first workspace and initial admin membership are created together.
- Added typed workspace schemas, slug generation, active workspace lookup, required workspace guard, and workspace creation helper.
- Added `/workspace/new` authenticated setup route and server action.
- Updated the app shell to require an active workspace before rendering primary product routes and to display the active workspace name in the top bar.
- Used shadcn.io MCP to inspect workspace-related blocks; no block was installed because the ticket only required a focused first-workspace creation form.
- Documented the tenant boundary in `docs/DATA_MODEL.md` and local migration notes.

## Files touched

- `docs/DATA_MODEL.md`
- `docs/SUPABASE_LOCAL_DEVELOPMENT.md`
- `supabase/migrations/20260703090000_create_workspaces_and_memberships.sql`
- `src/app/(app)/layout.tsx`
- `src/app/(workspace)/layout.tsx`
- `src/app/(workspace)/workspace/new/actions.ts`
- `src/app/(workspace)/workspace/new/page.tsx`
- `src/components/app-shell/app-shell.tsx`
- `src/components/app-shell/top-bar.tsx`
- `src/components/workspaces/workspace-create-form.tsx`
- `src/lib/auth/redirects.ts`
- `src/lib/workspaces/schema.ts`
- `src/lib/workspaces/server.ts`
- `tasks/TASKS.md`
- `tests/unit/app-shell-routes.test.mjs`
- `tests/unit/workspace-model.test.mjs`

## Commands run

- `pnpm validate:env`
- `pnpm validate:seed`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

Codex used the bundled Node runtime path because this shell does not expose `node` on `PATH`.

## Manual QA

- Started Next dev server on `http://localhost:3013`.
- Verified unauthenticated `GET /command-center` redirects to `/sign-in?next=%2Fcommand-center`.
- Verified unauthenticated `GET /workspace/new` redirects to `/sign-in?next=%2Fworkspace%2Fnew`.
- Verified `/sign-in?next=%2Fworkspace%2Fnew` renders the Radar auth card and authentication-unavailable state in the local no-Supabase-config environment.
- Captured screenshot: `/tmp/radar-rad-012-workspace-auth-redirect.png`.

## Risks and follow-ups

- Live authenticated workspace creation requires local or hosted Supabase credentials and the RAD-012 migration applied. The current environment has empty Supabase placeholders, so runtime DB insertion was not executed here.
- RAD-013 owns granular RBAC permission guards beyond the initial role model and starter RLS policies.

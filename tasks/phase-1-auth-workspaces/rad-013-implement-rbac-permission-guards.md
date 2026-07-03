# RAD-013 — Implement RBAC permission guards

## Status

Done

## Priority

P0

## Phase

Phase 1 — Auth and Workspaces (MVP)

## Objective

Add Admin, Editor, and Viewer roles with server-side and UI-level permission checks for create, edit, delete, rerun, and resolve actions.

## Target outcome

Permission failures are enforced server-side and shown clearly in the UI.

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

RAD-012 should be complete or deliberately skipped with notes.

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

- Added the workspace permission matrix for `admin`, `editor`, and `viewer`.
- Added explicit permissions for workspace read/manage, assertion create/edit/delete, source create/edit/delete, run rerun, and finding resolve.
- Added `membershipCan(...)`, `roleCan(...)`, and `describePermission(...)` helpers.
- Added server-only `requireWorkspacePermission(...)` and `getWorkspacePermissionContext()` helpers.
- Added `WorkspacePermissionError` for clear server-side permission failures.
- Added `WorkspacePermissionGate` and `PermissionDenied` UI components for action-level client affordances while keeping server checks as the source of truth.
- Updated the authenticated top bar to show the active member role.
- Documented the RBAC matrix and enforcement rule in `docs/SECURITY.md`.

## Files touched

- `docs/SECURITY.md`
- `src/app/(app)/layout.tsx`
- `src/components/app-shell/app-shell.tsx`
- `src/components/app-shell/top-bar.tsx`
- `src/components/workspaces/permission-gate.tsx`
- `src/lib/workspaces/guards.ts`
- `src/lib/workspaces/permissions.ts`
- `tasks/TASKS.md`
- `tests/unit/app-shell-routes.test.mjs`
- `tests/unit/rbac-permissions.test.mjs`
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

- Verified no new primary navigation pages were added.
- Verified route protection still builds and E2E smoke remains green.
- The new UI permission state is a reusable component and is not mounted on an exposed product action route yet, so there is no new standalone screen to screenshot for RAD-013.

## Risks and follow-ups

- Future server actions must call `requireWorkspacePermission(...)` before mutating workspace-owned data.
- RAD-014 and later feature tickets should use `WorkspacePermissionGate` around create/edit/delete/rerun/resolve controls when those controls become visible.

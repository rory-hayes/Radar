# RAD-007 — Create Radar app route structure and shell

## Status

Done

## Priority

P0

## Phase

Phase 0 — Foundation (MVP)

## Objective

Create the authenticated app route group and public route group with placeholder pages for Command Center, Assertions, Findings, Sources, and Settings hidden behind feature flag if needed.

## Target outcome

The app routes exist, use shared layout, and navigation does not produce broken links.

## Context

Radar is a customer-facing business verification product. This task must preserve the locked model: assertions define what should be verified, sources/runners are connected only when needed, and findings must be evidence-backed and business-readable.

## Scope


- Build a Radar-owned app shell using shadcn primitives/scaffold patterns, not a retained template.
- Main routes must remain limited to Command Center, Assertions, Findings, and Sources for V1.
- The shell must have sidebar, top bar, page header, and content region components.
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

RAD-006 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.
- Use `dashboard-01` or `sidebar-07` only as an implementation reference if needed.
- The shell should expose stable component boundaries: `AppShell`, `SidebarNav`, `TopBar`, and `PageHeader`.

## Expected files touched

package/config/app shell/docs/test files as required by the task.

## Acceptance criteria

- [x] The implemented behavior matches the objective and outcome.
- [x] The implementation fits Radar's assertion-led model.
- [x] The UI/API handles success, loading, empty, and error states where relevant.
- [x] Data persists correctly where applicable.
- [x] Workspace authorization is enforced where applicable.
- [x] No unrelated scope is introduced.
- [x] App shell exists and is Radar-owned, not copied template structure.
- [x] Primary navigation contains only the locked V1 pages.
- [x] Shell renders correctly in desktop and reasonable smaller-width states.

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

## Codex implementation notes

- Added the `(public)` route group for the existing landing placeholder and the `(app)` route group for Radar product routes.
- Added shell-wrapped routes for `/command-center`, `/assertions`, `/findings`, `/sources`, and hidden-from-primary-nav `/settings`.
- Added Radar-owned shell boundaries: `AppShell`, `SidebarNav`, `TopBar`, and `PageHeader`.
- Used existing shadcn primitives only; no dashboard block or template routes were installed.
- Primary sidebar navigation is limited to Command Center, Assertions, Findings, and Sources. Settings is route-accessible but not in primary nav.
- Added app route loading/error states and placeholder route content without fake product metrics.
- Added `tests/unit/app-shell-routes.test.mjs` and updated the foundation smoke test for the public route group.
- Hardened `pnpm typecheck` to remove stale generated Next route types before `next typegen`.
- Verified `shadcnio` MCP was connected with a lightweight `list_popular` call. No token or tokenized URL was written to source.
- Screenshot QA:
  - Desktop Command Center: `/tmp/radar-rad-007-command-center-desktop.png`
  - Mobile Assertions: `/tmp/radar-rad-007-assertions-mobile.png`
- Browser QA against `next start` on port 3011 returned 200 for `/`, `/command-center`, `/assertions`, `/findings`, `/sources`, and `/settings`; Settings was absent from primary nav and there were no console errors.
- Rechecked `next dev` on port 3012 with `HEAD /command-center`; route returned 200.

Commands run:

```bash
pnpm dlx shadcn@latest docs sidebar button badge breadcrumb
pnpm validate:env
pnpm lint
pnpm test
pnpm test:e2e
pnpm typecheck
pnpm build
next start --port 3011
next dev --webpack --port 3012
```

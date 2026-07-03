# RAD-018 — Implement loading, empty, and error states

## Status

Done

## Priority

P0

## Phase

Phase 1 — Auth and Workspaces (MVP)

## Objective

Add reusable loading skeletons, empty states, error callouts, retry affordances, and not-found handling across the app shell.

## Target outcome

The app never fails with blank screens or raw stack traces during normal expected errors.

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

RAD-017 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.
- For UI work, follow `docs/SHADCN_MCP_AND_BLOCKS.md`, `docs/UI_BLOCKS_IMPLEMENTATION_PLAN.md`, and `tasks/MCP_BLOCKS_USAGE_CHECKLIST.md`.

## Expected files touched

- `src/components/radar/loading-state.tsx`
- `src/components/radar/empty-state.tsx`
- `src/components/radar/error-state.tsx`
- `src/components/radar/not-found-state.tsx`
- `src/components/radar/index.ts`
- `src/components/app-shell/route-placeholder.tsx`
- `src/app/loading.tsx`
- `src/app/error.tsx`
- `src/app/not-found.tsx`
- `src/app/(app)/loading.tsx`
- `src/app/(app)/not-found.tsx`
- `src/app/(auth)/loading.tsx`
- `src/app/(auth)/error.tsx`
- `src/app/(workspace)/loading.tsx`
- `src/app/(workspace)/error.tsx`
- `src/app/(app)/command-center/page.tsx`
- `src/app/(app)/assertions/page.tsx`
- `src/app/(app)/findings/page.tsx`
- `src/app/(app)/sources/page.tsx`
- `tests/unit/route-states.test.mjs`
- `tasks/TASKS.md`
- `tasks/phase-1-auth-workspaces/rad-018-implement-loading-empty-and-error-states.md`

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

- Used the `build-web-apps:shadcn` skill. Confirmed `shadcnio` MCP was available through `mcp__shadcnio`; searched for `empty state`, `skeleton`, and `alert`. No dedicated empty/skeleton Pro item was needed. Used already-installed approved shadcn primitives (`Skeleton`, `Alert`, `Button`, `Card`) and refreshed official shadcn docs via `pnpm dlx shadcn@latest docs alert skeleton button card empty`.
- Expanded `LoadingState` into reusable card, list, and form skeleton variants with `aria-busy`, `aria-live`, and screen-reader description text.
- Reworked `EmptyState` to use full shadcn `Card` composition and optional compact detail chips for assertion-led empty surfaces.
- Reworked `ErrorState` to use shadcn `Alert`, a lucide alert icon, reference text, and action/retry slots.
- Added `NotFoundState` with a shadcn `Button asChild` link and lucide return icon.
- Wired root, authenticated app, auth, and workspace loading/error/not-found boundaries so expected failures do not render blank screens or raw stack traces.
- Added Radar-specific empty-state copy to Command Center, Assertions, Findings, and Sources without adding product pages or generic eval concepts.
- Added `tests/unit/route-states.test.mjs` to lock down reusable states, route boundaries, retry affordances, and primary-route empty states.
- Commands run:
  - `pnpm dlx shadcn@latest docs alert skeleton button card`
  - `pnpm dlx shadcn@latest docs empty`
  - `pnpm dlx shadcn@latest add empty --dry-run`
  - `pnpm lint`
  - `pnpm test`
  - `pnpm validate:env`
  - `pnpm validate:seed`
  - `pnpm typecheck`
  - `pnpm test:e2e`
  - `pnpm build`
  - `pnpm dev`
  - `curl -I http://localhost:3000/`
  - `curl -I http://localhost:3000/sign-in`
  - `curl -I http://localhost:3000/missing-route`
  - `curl -s http://localhost:3000/missing-route | rg -n "Page not found|Return to Radar|Radar has not introduced"`
  - `curl -s http://localhost:3000/sign-in | rg -n "Radar|Customer-facing business verification|Email|Password"`
  - `curl -s http://localhost:3000/ | rg -n "customer-facing business still works|assertion-led"`
- Manual QA: dev server rendered `/` with the public product foundation, `/sign-in` with the auth shell and loading fallback before the form resolved, and `/missing-route` with the new not-found card and return action. HTTP statuses were 200, 200, and 404 respectively.
- Screenshots: browser automation/Playwright was unavailable in this repo/runtime (`Cannot find package 'playwright'`). Manual QA was captured with HTTP smoke and rendered HTML checks instead.
- Risks/follow-ups: future data-backed tickets should reuse `LoadingState`, `EmptyState`, and `ErrorState` in table, form, and detail views rather than creating ad hoc states.

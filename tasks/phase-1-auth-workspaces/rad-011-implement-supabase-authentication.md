# RAD-011 — Implement Supabase authentication

## Status

Done

## Priority

P0

## Phase

Phase 1 — Auth and Workspaces (MVP)

## Objective

Wire Supabase Auth into the app with sign in, sign out, session loading, route protection, and server-side auth helpers.

## Target outcome

Authenticated pages are protected and unauthenticated users are redirected through a clear auth flow.

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

RAD-010 should be complete or deliberately skipped with notes.

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

- Added `@supabase/ssr` and `@supabase/supabase-js`.
- Added Supabase public config, browser client, server client, and proxy session refresh helpers.
- Added server-side authenticated user helpers based on `supabase.auth.getClaims()`.
- Added `src/proxy.ts` route protection for `/command-center`, `/assertions`, `/findings`, `/sources`, and `/settings`.
- Added `/sign-in`, `/sign-up`, `/auth/callback`, and `/auth/sign-out`.
- Added Radar-owned auth UI using shadcn primitives (`card`, `alert`, `button`, `input`, plus newly added `field` and `label`).
- Used shadcn.io MCP to inspect login-related blocks; `login-tenant-select` was too broad for this ticket, so no premium block was installed.
- Added top-bar authenticated user display and sign-out action.
- Documented local Supabase auth smoke testing in `README.md` and `docs/SUPABASE_LOCAL_DEVELOPMENT.md`.

## Files touched

- `README.md`
- `docs/SUPABASE_LOCAL_DEVELOPMENT.md`
- `package.json`
- `pnpm-lock.yaml`
- `src/app/(app)/layout.tsx`
- `src/app/(auth)/layout.tsx`
- `src/app/(auth)/loading.tsx`
- `src/app/(auth)/sign-in/page.tsx`
- `src/app/(auth)/sign-up/page.tsx`
- `src/app/auth/callback/route.ts`
- `src/app/auth/sign-out/route.ts`
- `src/components/app-shell/app-shell.tsx`
- `src/components/app-shell/top-bar.tsx`
- `src/components/auth/auth-form.tsx`
- `src/components/ui/field.tsx`
- `src/components/ui/label.tsx`
- `src/lib/auth/redirects.ts`
- `src/lib/auth/session.ts`
- `src/lib/supabase/browser.ts`
- `src/lib/supabase/config.ts`
- `src/lib/supabase/proxy.ts`
- `src/lib/supabase/server.ts`
- `src/proxy.ts`
- `tasks/TASKS.md`
- `tests/unit/app-shell-routes.test.mjs`
- `tests/unit/auth.test.mjs`
- `tests/unit/frontend-stack.test.mjs`

## Commands run

- `pnpm add @supabase/supabase-js @supabase/ssr`
- `pnpm dlx shadcn@latest add field label --yes`
- `pnpm validate:env`
- `pnpm validate:seed`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

The shell did not have `node` on `PATH`, so Codex reran Node-dependent commands with the bundled Codex runtime path.

## Manual QA

- Started Next dev server on `http://localhost:3012`.
- Verified `GET /command-center` redirects to `/sign-in?next=%2Fcommand-center` when Supabase auth is not configured.
- Verified `/sign-in?next=%2Fcommand-center` renders the Radar auth card and the authentication-unavailable error state without fake credentials.
- Verified Playwright browser smoke for desktop and mobile auth pages with no console errors.
- Screenshots:
  - `/tmp/radar-rad-011-auth-desktop.png`
  - `/tmp/radar-rad-011-auth-mobile.png`

## Risks and follow-ups

- Real sign-in/sign-up requires local or hosted Supabase credentials in `.env.local`; empty local placeholders intentionally show the unavailable state.
- Workspace membership, RBAC, and workspace isolation data policies are owned by RAD-012 and RAD-013.

# RAD-003 — Install and configure core frontend stack

## Status

Done

## Priority

P0

## Phase

Phase 0 — Foundation (MVP)

## Objective

Install and configure Tailwind, shadcn/ui conventions, React Hook Form, Zod, lucide icons, class utilities, and baseline component folders.

## Target outcome

The project has a consistent UI/component foundation that can support the four-page Radar product shell.

## Context

Radar is a customer-facing business verification product. This task must preserve the locked model: assertions define what should be verified, sources/runners are connected only when needed, and findings must be evidence-backed and business-readable.

## Scope


- Configure shadcn/ui using the official CLI and `components.json`.
- Configure the project to support shadcn MCP usage using `.codex/config.toml` and `docs/SHADCN_MCP_AND_BLOCKS.md`.
- Install the approved shadcn primitives required for the app shell and first dashboard pass.
- Use `dashboard-01` only as scaffolding if it accelerates the shell; strip demo content and unrelated routes immediately.
- Do not hardcode or commit any shadcn.io token; use `SHADCNIO_BEARER` environment auth only.
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

RAD-002 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.
- Run `/mcp` or equivalent and document whether `shadcnio` and `shadcn` are connected.
- If MCP is unavailable, use `npx shadcn@latest init` and `npx shadcn@latest add ...` directly.
- Minimum primitives expected by the end of this task: button, card, badge, table, tabs, input, select, dropdown-menu, separator, skeleton, alert, sonner, sidebar/breadcrumb if available.

## Expected files touched

package/config/app shell/docs/test files as required by the task.

## Acceptance criteria

- [x] The implemented behavior matches the objective and outcome.
- [x] The implementation fits Radar's assertion-led model.
- [x] The UI/API handles success, loading, empty, and error states where relevant. Existing route states still pass smoke coverage; no new product UI flow was added.
- [x] Data persists correctly where applicable. No persistence path changed in this foundation ticket.
- [x] Workspace authorization is enforced where applicable. No authorization path changed in this foundation ticket.
- [x] No unrelated scope is introduced.
- [x] shadcn/ui is initialized with a valid `components.json`.
- [x] MCP setup is documented and token-safe.
- [x] Approved primitives are installed or documented as deferred with a reason.
- [x] No template/demo routes remain exposed in the product.

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
- [x] Capture screenshots for UI changes. Not applicable; RAD-003 added the component stack and providers without introducing a new product screen. Manual HTML smoke was captured in notes.

## Definition of done

- [x] Code complete and scoped to this ticket.
- [x] Acceptance criteria satisfied.
- [x] Test criteria satisfied or documented with approved exception.
- [x] No hardcoded secrets or sensitive logging.
- [x] Ticket checklist updated.
- [x] PR summary includes changed files, testing, screenshots for UI work, and risks.

## Codex notes

Implemented the RAD-003 frontend stack foundation:

- Verified `shadcnio` MCP was callable with `mcp__shadcnio.list_popular`; no token or tokenized URL was written to the repo.
- Initialized shadcn with `components.json` using the official shadcn CLI, Next.js, Tailwind v4, Radix, RSC, Lucide, and `src/` aliases.
- Installed Tailwind/PostCSS, React Hook Form, Zod, `@hookform/resolvers`, lucide icons, class utility dependencies, and the shadcn helper `cn`.
- Installed approved primitives: alert, avatar, badge, breadcrumb, button, card, dialog, dropdown-menu, input, popover, progress, select, separator, sheet, sidebar, skeleton, sonner, table, tabs, textarea, and tooltip.
- Added Tooltip and Sonner providers to the root layout.
- Added Radar-owned Tailwind v4 semantic tokens in `src/app/globals.css` while preserving the existing RAD-001 placeholder page styles.
- Did not install `dashboard-01` or any block because this ticket only required the stack foundation; no demo routes or template pages were introduced.
- Replaced the generated `use-mobile` effect/state implementation with `useSyncExternalStore` to satisfy React 19 lint rules.
- Added a pnpm override from native `lightningcss` to `lightningcss-wasm` and explicitly installed `@tailwindcss/oxide-wasm32-wasi`. The Next dev/build scripts set `NAPI_RS_FORCE_WASI=true` so Tailwind can build inside Codex without unsigned native binary failures.
- Added `tests/unit/frontend-stack.test.mjs` to lock the shadcn config, core primitive files, Tailwind imports, and frontend stack dependencies.
- Removed the unused `shadcn` package from runtime dependencies; shadcn remains available through MCP and `pnpm dlx shadcn@latest ...` commands.

Commands run:

- `mcp__shadcnio.list_popular` — passed; `shadcnio` MCP connected.
- `pnpm dlx shadcn@latest docs button card form sidebar sonner` — passed; official docs URLs were returned for button, card, sidebar, and sonner. The current registry returned no separate form docs link.
- `pnpm dlx shadcn@latest add button card badge table tabs input select dropdown-menu separator skeleton alert sonner sidebar breadcrumb form textarea dialog sheet tooltip popover progress avatar` — passed; the current registry did not emit a separate `form.tsx`, so form foundation is covered by React Hook Form, Zod, resolver, input/select/textarea, and future field composition.
- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm test` — passed, 7 unit tests.
- `pnpm test:e2e` — passed, 3 smoke tests.
- `pnpm build` — passed. Next still logs the known local SWC native-loader warning and falls back to WASM. Tailwind runs through WASI and logs Node's experimental WASI warning locally.
- `pnpm dev` — passed; local server started on `http://localhost:3000`.
- `curl -fsS http://localhost:3000` — passed; returned the Radar placeholder HTML with layout CSS and providers loaded.
- `git diff --check` — passed.
- Secret scan for the provided shadcn.io token and bearer patterns — passed.

Follow-ups:

- Continue with RAD-004 on the next focused branch.

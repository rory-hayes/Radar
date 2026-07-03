# RAD-003 — Install and configure core frontend stack

## Status

Backlog

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

- [ ] The implemented behavior matches the objective and outcome.
- [ ] The implementation fits Radar's assertion-led model.
- [ ] The UI/API handles success, loading, empty, and error states where relevant.
- [ ] Data persists correctly where applicable.
- [ ] Workspace authorization is enforced where applicable.
- [ ] No unrelated scope is introduced.
- [ ] shadcn/ui is initialized with a valid `components.json`.
- [ ] MCP setup is documented and token-safe.
- [ ] Approved primitives are installed or documented as deferred with a reason.
- [ ] No template/demo routes remain exposed in the product.

## Test criteria

- [ ] Relevant unit and integration tests are added or updated.
- [ ] Manual QA steps are documented in the PR summary.
- [ ] No existing E2E smoke flow is broken.
- [ ] `pnpm lint` passes.
- [ ] `pnpm typecheck` passes.
- [ ] `pnpm test` passes or a documented reason is provided for unavailable test command.
- [ ] `pnpm build` passes.
- [ ] `pnpm test:e2e` passes where applicable.


## UI / MCP checklist

- [ ] Read `docs/SHADCN_MCP_AND_BLOCKS.md` and `docs/UI_BLOCKS_IMPLEMENTATION_PLAN.md`.
- [ ] Checked MCP status or documented CLI fallback.
- [ ] Used only the smallest approved shadcn primitive/block needed.
- [ ] Removed demo content and unrelated template routes.
- [ ] Confirmed UI remains enterprise, minimal, and Radar-specific.
- [ ] Included screenshots or manual QA notes in PR summary.

## Manual QA checklist

- [ ] Open the affected page or run the affected workflow locally.
- [ ] Verify the happy path.
- [ ] Verify at least one relevant sad path.
- [ ] Verify no unrelated primary navigation/pages changed unexpectedly.
- [ ] Capture screenshots for UI changes.

## Definition of done

- [ ] Code complete and scoped to this ticket.
- [ ] Acceptance criteria satisfied.
- [ ] Test criteria satisfied or documented with approved exception.
- [ ] No hardcoded secrets or sensitive logging.
- [ ] Ticket checklist updated.
- [ ] PR summary includes changed files, testing, screenshots for UI work, and risks.

## Codex notes

Codex should append implementation notes, commands run, failures, and follow-ups here before marking this task Done.

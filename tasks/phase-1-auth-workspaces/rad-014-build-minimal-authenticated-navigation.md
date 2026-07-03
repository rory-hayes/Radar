# RAD-014 — Build minimal authenticated navigation

## Status

Backlog

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

- [ ] The implemented behavior matches the objective and outcome.
- [ ] The implementation fits Radar's assertion-led model.
- [ ] The UI/API handles success, loading, empty, and error states where relevant.
- [ ] Data persists correctly where applicable.
- [ ] Workspace authorization is enforced where applicable.
- [ ] No unrelated scope is introduced.
- [ ] UI work follows the shadcn/MCP usage checklist where applicable.

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

Codex should append implementation notes, commands run, failures, and follow-ups here before marking this task ready for review.

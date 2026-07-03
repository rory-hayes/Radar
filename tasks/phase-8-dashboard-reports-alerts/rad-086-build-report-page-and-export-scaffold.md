# RAD-086 — Build report page and export scaffold

## Status

Done

## Priority

P1

## Phase

Phase 8 — Command Center, Reports, Alerts (Beta)

## Objective

Create a report detail page and export-ready data structure for future PDF/email delivery.

## Target outcome

Reports can be viewed in-app and later exported without redesign.

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

RAD-085 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.
- For UI work, follow `docs/SHADCN_MCP_AND_BLOCKS.md`, `docs/UI_BLOCKS_IMPLEMENTATION_PLAN.md`, and `tasks/MCP_BLOCKS_USAGE_CHECKLIST.md`.

## Expected files touched

Command Center UI, reporting jobs, notification code, analytics instrumentation, and tests.

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

## Result: Done

- Added a guarded `/reports/weekly` detail page that generates the weekly trust report from active workspace assertions, runs, and findings.
- Added an export-ready report payload scaffold with stable section blocks for executive summary, metrics, risky categories, open exceptions, resolved findings, and next actions.
- Added a working JSON download for the scaffold while leaving PDF/email delivery to later tickets.
- Linked the Command Center weekly report panel to the report detail page without adding Reports to primary navigation.

## Validation

- Passed: `pnpm test -- --test-name-pattern 'RAD-086|RAD-085'`.
- Passed after route protection fix: `pnpm test -- --test-name-pattern 'RAD-086|RAD-007|RAD-020'`.
- Passed: `pnpm lint`.
- Passed: `pnpm typecheck`.
- Passed: `pnpm test`.
- Passed: `pnpm test:e2e`.
- Passed: `pnpm validate:seed`.
- Passed: `pnpm validate:env`.
- Passed: `pnpm db:harness`.
- Passed: `pnpm build`.
- Passed smoke: `curl -I http://localhost:3024/reports/weekly` returned `307 Temporary Redirect` to `/sign-in?next=%2Freports%2Fweekly`.
- Passed smoke: `curl -I http://localhost:3024/command-center` returned `307 Temporary Redirect` to `/sign-in?next=%2Fcommand-center`.
- Blocked by local environment: `pnpm db:harness:apply` requires Docker and failed with `Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`.

## Manual QA notes

- Open `/reports/weekly` in an authenticated workspace and verify the report sections render.
- Use the JSON export link and verify the downloaded file contains the report export payload.
- Verify `/reports/weekly` stays outside primary navigation and `/command-center` links to it from the Weekly trust report panel.

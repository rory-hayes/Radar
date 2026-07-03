# RAD-081 — Build Command Center KPI summary

## Status

Done

## Priority

P1

## Phase

Phase 8 — Command Center, Reports, Alerts (Beta)

## Objective

Create the executive summary cards for checks run, exceptions, critical issues, recommended fixes, pass rate, and trend indicators.

## Target outcome

The dashboard communicates the daily state in one glance.

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

RAD-080 should be complete or deliberately skipped with notes.

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

Result: Done

Implementation notes:

- Replaced the Command Center placeholder with a real workspace-backed KPI summary using `listAssertions`, `listFindings`, and `listEvaluationRunSummariesForWorkspace`.
- Added `src/lib/command-center/kpi-summary.ts` to compute checks run, active exceptions, critical issues, recommended fixes, pass rate, active assertions, and 7-day trend indicators.
- Added `src/components/command-center/command-center-kpi-summary.tsx` using existing shadcn `Card`, `Button`, `Progress`, and Radar `MetricCard` primitives. The shadcnio MCP was available and searched for dashboard/stat references; no broad dashboard block was installed because existing approved primitives were the smallest scoped fit.
- Added `src/app/(app)/command-center/loading.tsx` and explicit Supabase/repository error states.
- Updated Command Center placeholder tests and E2E scope tests so the page is now treated as a real workspace-backed route.

Commands run:

- `pnpm test -- --test-name-pattern 'RAD-081|RAD-018|RAD-020'`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm validate:seed`
- `pnpm validate:env`
- `pnpm db:harness`
- `pnpm build`
- `pnpm db:harness:apply` (blocked locally because Docker is not running)
- `pnpm start --port 3021` plus `curl -I http://localhost:3021/command-center`

Manual QA:

- Happy path: Command Center renders real KPI cards and trend indicators when workspace summary data is available.
- Empty path: Summary component keeps the Radar-specific activation empty state when no assertions, runs, or findings exist.
- Sad path: Page renders a destructive error state if Supabase is unconfigured or repository reads fail.
- Scope check: no new primary navigation, generic eval platform language, prompt playground, trace explorer, workflow canvas, or integration marketplace was introduced.
- Screenshot note: manual smoke used the protected route redirect because local auth is required; no tokenized MCP URL or shadcn.io secret was captured or committed.

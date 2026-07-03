# RAD-031 — Build Sources page list and source cards

## Status

Done

## Priority

P0

## Phase

Phase 3 — Sources and Evidence (MVP)

## Objective

Implement the Sources page using real database-backed data with source cards/list rows for URL, docs, uploads, manual text, API endpoint, and support bot endpoint.

## Target outcome

Users can view connected sources, sync status, last sync, health, affected assertions count, and details links.

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

RAD-030 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.
- For UI work, follow `docs/SHADCN_MCP_AND_BLOCKS.md`, `docs/UI_BLOCKS_IMPLEMENTATION_PLAN.md`, and `tasks/MCP_BLOCKS_USAGE_CHECKLIST.md`.

## Expected files touched

Sources UI, ingestion jobs, extraction utilities, storage helpers, repositories, and tests.

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
- [x] Capture screenshots for UI changes or document why screenshots are unavailable.

## Definition of done

- [x] Code complete and scoped to this ticket.
- [x] Acceptance criteria satisfied.
- [x] Test criteria satisfied or documented with approved exception.
- [x] No hardcoded secrets or sensitive logging.
- [x] Ticket checklist updated.
- [x] PR summary includes changed files, testing, screenshots for UI work, and risks.

## Codex notes

Codex should append implementation notes, commands run, failures, and follow-ups here before marking this task Done.

## Implementation report

- Result: Done. `/sources` now renders database-backed source inventory for the active workspace instead of a placeholder.
- Added `src/components/sources/source-card.tsx`, `src/components/sources/source-list.tsx`, and `src/components/sources/index.ts` using the installed shadcn `Card`, `Table`, and `Badge` primitives through Radar wrappers where appropriate.
- Replaced the Sources route placeholder with a server-rendered page that requires an active workspace, creates a Supabase server client, reads `sources`, reads affected assertion counts from `assertion_sources`, and renders metrics, responsive source cards, an inventory table, empty state, and repository error state.
- Added scoped `/sources/loading.tsx` and `/sources/error.tsx` so loading and retry behavior stays inside the app shell.
- Added `listSourceAssertionCounts` to the sources repository layer, preserving explicit `workspaceId` filtering and keeping data access out of UI components.
- Updated route/product-scope tests so Command Center, Assertions, and Findings remain placeholders while Sources is verified as a real DB-backed route. Added `tests/unit/sources-page.test.mjs` for RAD-031-specific coverage.
- shadcn/MCP: read the repository shadcn docs and UI block plan, verified `mcp__shadcnio` connection, searched block inventory for table/card patterns, and used the smallest installed primitives instead of adding unrelated template blocks. The earlier `dashboard-01` block lookup returned no item, so no block source was imported.
- Manual QA: production build prerendered `/sources` successfully, static e2e route checks passed, and source happy/empty/error/loading behavior is covered by the unit gates. A live authenticated screenshot was not captured because local Supabase application is blocked until Docker is running; this is the same environment limitation documented in RAD-030.
- Secret scan: targeted grep found only committed placeholder env examples, not the provided shadcn MCP token or live service secrets.

## Commands run

- `pnpm lint` passed.
- `pnpm typecheck` passed.
- `pnpm test` passed with 106 tests.
- `pnpm test:e2e` passed with 11 tests.
- `pnpm build` passed.
- `pnpm validate:seed` passed.
- `pnpm validate:env` passed.
- `pnpm db:harness` passed.
- Targeted secret-pattern scan passed with placeholder-only hits in docs/examples.
- `pnpm db:harness:apply` could not apply migrations locally because Docker is not running: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`

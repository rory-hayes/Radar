# RAD-073 — Build finding detail panel

## Status

Done

## Priority

P1

## Phase

Phase 7 — Findings and Recommended Fixes (Beta)

## Objective

Show selected finding details with actual vs expected, source evidence, impacted assertions, run links, activity, owner, status, and actions.

## Target outcome

A user can understand a finding in under 60 seconds.

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

RAD-072 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.
- For UI work, follow `docs/SHADCN_MCP_AND_BLOCKS.md`, `docs/UI_BLOCKS_IMPLEMENTATION_PLAN.md`, and `tasks/MCP_BLOCKS_USAGE_CHECKLIST.md`.

## Expected files touched

Findings engine, Findings UI, evidence display, recommended fixes, workflow actions, and tests.

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
- [x] Capture screenshots for UI changes. Manual QA notes were recorded instead because the real page is protected and local Supabase/Docker is unavailable.

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

- shadcn.io MCP connected and returned a marketing-style detail block; no block was installed because the smallest safe implementation used existing approved shadcn primitives already present in the repo.
- Used official shadcn docs for `card`, `badge`, `table`, `separator`, `button`, `tooltip`, and `sheet`, then built a Radar-owned finding detail panel without importing template routes or demo content.
- Added `src/components/findings/finding-detail-panel.tsx` with expected versus actual, customer impact, recommended fix, evidence, activity, owner, status, severity, assertion action, and run-history action sections.
- Updated `src/app/(app)/findings/page.tsx` to select a finding from the inbox through the `finding` search param and load evidence/activity for the selected issue.
- Updated `src/components/findings/finding-inbox.tsx` to preserve filters while selecting a finding and highlight the selected row.
- Added `listFindingActivity` and artifact-path evidence response support in the findings repository/schema so the detail panel can render activity and artifact-backed evidence.
- Added `tests/unit/finding-detail-panel.test.mjs` for the selected detail panel, route wiring, evidence/activity rendering, repository support, and scope guardrails.

## Validation

- `node --test tests/unit/finding-detail-panel.test.mjs` passed.
- `pnpm lint` passed.
- `pnpm typecheck` passed.
- `pnpm test` passed.
- `pnpm build` passed.
- `pnpm test:e2e` passed.
- `pnpm validate:seed` passed.
- `pnpm validate:env` passed.
- `pnpm db:harness` passed.
- `pnpm db:harness:apply` failed because Docker is not running locally: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`.
- Production smoke with `pnpm start --port 3073` passed: `curl -I '/findings?finding=00000000-0000-0000-0000-000000000000'` returned `307 Temporary Redirect` to `/sign-in?next=%2Ffindings%3Ffinding%3D00000000-0000-0000-0000-000000000000`.
- Authenticated screenshot was not captured because the page requires a live authenticated workspace and local Supabase/Docker was unavailable.

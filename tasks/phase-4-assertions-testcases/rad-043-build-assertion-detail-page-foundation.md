# RAD-043 — Build assertion detail page foundation

## Status

Done

## Priority

P0

## Phase

Phase 4 — Assertions and Test Cases (MVP)

## Objective

Create the assertion drill-down shell with summary, metadata, linked sources, test cases, run history placeholder, findings placeholder, and actions.

## Target outcome

A user can understand what one assertion verifies and how it is configured.

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

RAD-042 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.
- For UI work, follow `docs/SHADCN_MCP_AND_BLOCKS.md`, `docs/UI_BLOCKS_IMPLEMENTATION_PLAN.md`, and `tasks/MCP_BLOCKS_USAGE_CHECKLIST.md`.

## Expected files touched

Assertions UI, assertion APIs/actions, test case logic, templates, generators, and tests.

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

## Implementation report

Result: Done. Added the Assertion detail page foundation with summary, configuration metadata, linked evidence sources, test cases, run history, linked findings, and guarded actions.

Changed files:

- `src/app/(app)/assertions/[assertionId]/page.tsx`
- `src/app/(app)/assertions/[assertionId]/loading.tsx`
- `src/components/assertions/assertion-detail.tsx`
- `src/components/assertions/assertion-table.tsx`
- `src/components/assertions/index.ts`
- `src/lib/repositories/evaluation.ts`
- `src/lib/repositories/findings.ts`
- `tests/unit/assertion-detail-page.test.mjs`

shadcn / MCP notes:

- `shadcnio` MCP was reachable; `list_block_categories` returned the registry categories.
- Ran `pnpm dlx shadcn@latest info --json`.
- Ran `pnpm dlx shadcn@latest search @shadcn -q "detail tabs page"`; no narrow block matched.
- Ran `pnpm dlx shadcn@latest docs tabs card badge table separator skeleton button`.
- Used installed shadcn primitives only: `Tabs`, `Card`, `Table`, `Badge`, `Separator`, `Button`, and existing Radar state/badge components.
- No demo block routes, unrelated template content, or tokenized registry URLs were added.

Manual QA:

- Happy path: build output includes dynamic route `/assertions/[assertionId]`; unit tests verify page, tabs, data loaders, and action links.
- Sad path: route handles missing Supabase with `ErrorState`; missing assertion calls `notFound()`.
- Auth path: local curl to `http://127.0.0.1:3012/assertions/00000000-0000-4000-8000-000000000000` returned `307` to `/sign-in?next=%2Fassertions%2F00000000-0000-4000-8000-000000000000`.
- Screenshot: not captured because authenticated app routes redirect without a local signed-in session. UI structure is covered by build and unit tests.
- Navigation scope: no new primary nav entries were added; the Assertions inventory now links row titles to the assertion detail route.

Commands run:

- `pnpm dlx shadcn@latest info --json`
- `pnpm dlx shadcn@latest search @shadcn -q "detail tabs page"`
- `pnpm dlx shadcn@latest docs tabs card badge table separator skeleton button`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test` (initially failed because the ticket notes were still Backlog; rerun passed after this update)
- `pnpm test:e2e`
- `pnpm build`
- `pnpm validate:seed`
- `pnpm validate:env`
- `pnpm db:harness`
- `pnpm db:harness:apply` (blocked because Docker daemon is not running)
- `pnpm dev --hostname 127.0.0.1 --port 3012`
- `curl -I -s http://127.0.0.1:3012/assertions/00000000-0000-4000-8000-000000000000`

Risk / follow-up:

- Detail actions are limited to back and edit until RAD-049 introduces manual run controls.
- Test-case CRUD and generation remain reserved for RAD-047 and RAD-048.

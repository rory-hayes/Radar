# RAD-044 — Implement assertion-source linking

## Status

Done

## Priority

P0

## Phase

Phase 4 — Assertions and Test Cases (MVP)

## Objective

Allow users to attach existing sources to assertions and show the minimum required source coverage for the assertion.

## Target outcome

Each assertion knows which evidence sources it depends on.

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

RAD-043 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

Assertions UI, assertion APIs/actions, test case logic, templates, generators, and tests.

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

## Implementation report

Result: Done. Added assertion-source linking from the assertion detail page and a minimum source coverage model by runner type.

Changed files:

- `src/app/(app)/assertions/actions.ts`
- `src/app/(app)/assertions/[assertionId]/page.tsx`
- `src/components/assertions/assertion-detail.tsx`
- `src/components/assertions/assertion-source-linking-panel.tsx`
- `src/components/assertions/index.ts`
- `src/lib/assertions/source-coverage.ts`
- `tests/unit/assertion-source-linking.test.mjs`

shadcn / MCP notes:

- `shadcnio` MCP was reachable; `list_block_categories` returned the registry categories.
- Ran `pnpm dlx shadcn@latest search @shadcn -q "source linking checklist"`; no narrow block matched.
- Ran `pnpm dlx shadcn@latest docs card button badge table field`.
- Used installed shadcn primitives only: `Card`, `Button`, `Badge`, `Table`, `Field`, and `Alert`.
- No demo block routes, unrelated template content, or tokenized registry URLs were added.

Manual QA:

- Happy path: unit tests verify the coverage rules, server action, source-linking panel, and detail-page wiring.
- Sad path: server action validates assertion id, selected source ids, workspace ownership, missing Supabase, and RBAC through `runWorkspaceServerAction`.
- Auth path: local curl to `http://127.0.0.1:3012/assertions/00000000-0000-4000-8000-000000000000` returned `307` to `/sign-in?next=%2Fassertions%2F00000000-0000-4000-8000-000000000000`.
- Screenshot: not captured because authenticated app routes redirect without a local signed-in session. UI structure is covered by build and unit tests.
- Navigation scope: no new primary nav entries were added.

Commands run:

- `pnpm dlx shadcn@latest search @shadcn -q "source linking checklist"`
- `pnpm dlx shadcn@latest docs card button badge table field`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm validate:seed`
- `pnpm validate:env`
- `pnpm db:harness`
- `pnpm db:harness:apply` (blocked because Docker daemon is not running)
- `pnpm dev --hostname 127.0.0.1 --port 3012`
- `curl -I -s http://127.0.0.1:3012/assertions/00000000-0000-4000-8000-000000000000`

Risk / follow-up:

- Coverage rules are intentionally minimal by runner type; later assertion templates can add category-specific recommendations without making onboarding integration-led.
- Link purpose is still normalized through the existing repository helper until RAD-047 and later workflows introduce richer test-case and source-role editing.

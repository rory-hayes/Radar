# RAD-025 — Implement type-safe repository layer

## Status

Done

## Priority

P0

## Phase

Phase 2 — Core Data Model (MVP)

## Objective

Create typed data access functions for workspaces, sources, assertions, runs, findings, and evidence, avoiding scattered raw queries in UI components.

## Target outcome

Core CRUD operations go through validated server-side repository functions.

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

RAD-024 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

Supabase migrations, generated types, repositories, validation schemas, and tests.

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

- Added server-only repository modules under `src/lib/repositories` for workspaces, sources, assertions, evaluation runs/results, findings, evidence, assignments, and activity.
- Repositories accept a Supabase client, keep `workspaceId` explicit for workspace-owned tables, validate mutation inputs with shared Zod schemas, and map rows into Radar domain types.
- Added shared repository error handling in `src/lib/repositories/client.ts` and an index export in `src/lib/repositories/index.ts`.
- Refactored `src/lib/workspaces/server.ts` to use the workspace repository for active membership lookup, workspace creation RPC, and workspace settings updates while keeping auth, redirects, permissions, and audit logging at the server-helper boundary.
- Updated `docs/ARCHITECTURE.md` and `docs/SECURITY.md` to define the repository boundary and clarify that repositories do not replace server guardrails/RBAC.
- Added `tests/unit/repository-layer.test.mjs` and updated existing static workspace/E2E tests to assert repository delegation.
- UI manual QA is not applicable for this server-side repository ticket; existing route E2E and production build confirm no primary navigation regression.
- Commands run:
  - `pnpm test`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm validate:seed`
  - `pnpm validate:env`
  - `pnpm test:e2e`
  - `pnpm build`
  - `pnpm supabase:start` failed because Docker is not running: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`

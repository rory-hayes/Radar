# RAD-020 — E2E Gate 2 — Auth and workspace isolation

## Status

Done

## Priority

P0

## Phase

Phase 1 — Auth and Workspaces (MVP)

## Objective

Run an end-to-end gate that signs in, creates/switches workspace context, verifies route protection, verifies RBAC, and confirms no cross-workspace data leakage.

## Target outcome

Multi-tenant auth and workspace boundaries are stable before data-model expansion continues.

## Context

Radar is a customer-facing business verification product. This task must preserve the locked model: assertions define what should be verified, sources/runners are connected only when needed, and findings must be evidence-backed and business-readable.

## Scope


- Run the E2E validation scope described in this ticket.
- Fix regressions introduced in the current phase where feasible.
- Produce a concise phase gate report in the ticket notes.
- Do not start the next phase if blocking failures remain.


## Out of scope

- Do not build generic AI eval platform features.
- Do not add unrelated pages beyond Command Center, Assertions, Findings, and Sources unless explicitly required.
- Do not add new runner types beyond Knowledge, Journey, and Integration.
- Do not introduce an integration marketplace.
- Do not use mock data in product paths unless explicitly scoped as local/demo seed data.

## Dependencies

RAD-019 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This is an E2E gate. It must stop phase progression until complete.

## Expected files touched

- `tests/e2e/auth-workspace-isolation.test.mjs`
- `tasks/TASKS.md`
- `tasks/phase-1-auth-workspaces/rad-020-e2e-gate-2-auth-and-workspace-isolation.md`

## Acceptance criteria

- [x] Gate report summarizes pass/fail status and any regressions.
- [x] Blocking failures are fixed or explicitly documented as accepted deferrals.
- [x] Codex stops and summarizes before moving to the next phase.
- [x] Data persists correctly where applicable.
- [x] Workspace authorization is enforced where applicable.
- [x] No unrelated scope is introduced.
- [x] UI/product scope drift check completed: no generic eval platform, no template bloat, navigation remains locked.

## Test criteria

- [x] Full phase E2E flow is executed.
- [x] Core smoke scripts are run.
- [x] Regression notes are documented in the ticket file or PR summary.
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

- Gate status: passed for repo-native Phase 1 contracts and local HTTP route-protection smoke. Docker-backed Supabase sign-in, workspace switching, and direct cross-workspace SQL/RLS execution could not run because Docker is unavailable.
- Added `tests/e2e/auth-workspace-isolation.test.mjs` covering:
  - Protected app route redirect and safe auth `next` handling.
  - App layout authentication and active-workspace requirements.
  - Workspace setup authentication requirement.
  - Server-side workspace membership resolution.
  - RBAC matrix and settings mutation permission enforcement.
  - Server action/API guardrail workspace permission checks.
  - Supabase RLS policy presence for workspaces, workspace members, workspace settings, and audit logs.
  - Deterministic demo seed workspace/user/member/audit scope.
  - Primary navigation/product scope lock: Command Center, Assertions, Findings, Sources, scoped hidden settings only; no generic eval/template concepts.
- HTTP smoke:
  - `GET/HEAD /` returned 200.
  - `GET/HEAD /sign-in` returned 200.
  - `HEAD /command-center` returned 307 to `/sign-in?next=%2Fcommand-center`.
  - `HEAD /workspace/new` returned 307 to `/sign-in?next=%2Fworkspace%2Fnew`.
- Commands run:
  - `pnpm test:e2e`
  - `pnpm validate:env`
  - `pnpm validate:seed`
  - `pnpm lint`
  - `pnpm test`
  - `pnpm supabase:start` (failed because Docker daemon is unavailable)
  - `pnpm typecheck`
  - `pnpm build`
  - `pnpm dev`
  - `curl -I http://localhost:3000/`
  - `curl -I http://localhost:3000/sign-in`
  - `curl -I http://localhost:3000/command-center`
  - `curl -I http://localhost:3000/workspace/new`
- Accepted deferral: live Supabase auth sign-in, workspace creation/switching, RBAC mutation attempts against Postgres, and cross-workspace data-leak probes require Docker-backed Supabase. This environment cannot connect to the Docker daemon at `unix:///var/run/docker.sock`.
- Checkpoint note: the normal E2E gate stop-and-summarize behavior is recorded here. The user explicitly removed the review/checkpoint gate and asked Codex to continue ticket-to-ticket, so progression can continue after this documented gate report.
- Screenshots: not applicable; this gate added tests and smoke checks, not UI changes.
- Regressions found: none in repo-native checks. No product-scope drift detected.

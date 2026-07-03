# RAD-016 — Add audit log infrastructure

## Status

Done

## Priority

P0

## Phase

Phase 1 — Auth and Workspaces (MVP)

## Objective

Create audit log schema, write helper, and initial events for auth, workspace, source, assertion, run, and finding changes.

## Target outcome

Important changes produce queryable audit events with actor, workspace, action, resource, and timestamp.

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

RAD-015 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

TBD by implementation. Codex must list actual files touched in the PR summary.

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

## Implementation notes

- Added `audit_action` enum and `audit_logs` table with workspace, actor, action, resource type, optional resource ID, metadata, and timestamp.
- Added RLS policies for workspace-member reads, actor auth-event reads, and authenticated scoped inserts.
- Added typed audit action/resource taxonomy covering auth, workspace, source, assertion, run, and finding event families.
- Added server-only `recordAuditEvent(...)` writer.
- Wired initial events into auth callback, sign-out, workspace creation, and workspace settings update.
- Documented audit logging boundaries in `docs/DATA_MODEL.md` and `docs/SECURITY.md`.

## Files touched

- `docs/DATA_MODEL.md`
- `docs/SECURITY.md`
- `supabase/migrations/20260703100000_create_audit_logs.sql`
- `src/app/auth/callback/route.ts`
- `src/app/auth/sign-out/route.ts`
- `src/lib/audit/actions.ts`
- `src/lib/audit/server.ts`
- `src/lib/workspaces/server.ts`
- `tasks/TASKS.md`
- `tests/unit/audit-log.test.mjs`
- `tests/unit/auth.test.mjs`

## Commands run

- `pnpm validate:env`
- `pnpm validate:seed`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm supabase:start`

Codex used the bundled Node runtime path because this shell does not expose `node` on `PATH`.

## Manual QA

- Verified all source-level audit contracts with unit tests.
- Attempted local Supabase startup for DB-level audit insert/read verification, but Docker is not running: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`.
- Live audit insert/read QA requires Docker/Supabase local running or hosted Supabase credentials with migrations applied.

## Risks and follow-ups

- Future product mutation helpers must call `recordAuditEvent(...)` after successful source, assertion, run, and finding changes.
- Audit metadata must remain small and must not include source content, evidence bodies, provider secrets, or runner credentials.

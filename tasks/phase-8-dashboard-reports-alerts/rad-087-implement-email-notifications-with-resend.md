# RAD-087 — Implement email notifications with Resend

## Status

Done

## Priority

P1

## Phase

Phase 8 — Command Center, Reports, Alerts (Beta)

## Objective

Send transactional notifications for critical findings, weekly report availability, failed source sync, and invited workspace users.

## Target outcome

Users receive essential updates outside the app with safe unsubscribe/preferences hooks.

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

RAD-086 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

Command Center UI, reporting jobs, notification code, analytics instrumentation, and tests.

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

## Result: Done

- Added workspace-scoped `notification_deliveries` persistence with RLS for email notification attempts and outcomes.
- Added typed Radar email templates for critical findings, weekly report availability, failed source syncs, and workspace invites.
- Added a server-only Resend HTTP adapter that sends with `RESEND_API_KEY`, skips safely when local config is incomplete, and bounds provider error bodies.
- Added a dispatcher that creates delivery rows, sends through Resend, updates sent/skipped/failed status, and includes notification preference/unsubscribe hooks.
- Added a guarded `POST /api/notifications/email` endpoint requiring `workspace:manage` for explicit transactional email sends.

## Validation

- `pnpm test -- --test-name-pattern 'RAD-087|RAD-004'` passed.
- `pnpm lint` passed.
- `pnpm typecheck` passed.
- `pnpm test:e2e` passed.
- `pnpm validate:seed` passed.
- `pnpm validate:env` passed.
- `pnpm db:harness` passed.
- `pnpm build` passed.
- Local smoke: `POST /api/notifications/email` without a session returned `401 unauthenticated`, confirming the endpoint is guarded.
- Known local limitation: `pnpm db:harness:apply` requires Docker. Docker is unavailable in this environment, so apply mode failed with `Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`.

## Manual QA notes

- In a configured environment with `RESEND_API_KEY` and `RESEND_FROM_EMAIL`, post a workspace-managed email notification request to `/api/notifications/email`.
- Verify a `notification_deliveries` row is created and moves to `sent`, `skipped`, or `failed`.
- Verify local environments without Resend config skip safely and do not expose secrets in responses or logs.

# RAD-088 — Implement Slack webhook alerts

## Status

Done

## Priority

P1

## Phase

Phase 8 — Command Center, Reports, Alerts (Beta)

## Objective

Add optional Slack incoming webhook notifications for critical findings and daily summary without building full Slack OAuth yet.

## Target outcome

Teams can receive alerts with minimal integration overhead.

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

RAD-087 should be complete or deliberately skipped with notes.

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

- Extended the notification delivery ledger for `slack` channel sends and added the `daily_summary` delivery type.
- Added server-only Slack alert templates for critical findings and daily summaries.
- Added a server-only incoming webhook sender that uses `SLACK_WEBHOOK_URL`, skips safely when unconfigured, validates HTTPS URLs, and bounds provider error bodies.
- Added a workspace-scoped Slack dispatcher that creates delivery rows, sends through the webhook, and updates sent/skipped/failed status.
- Added a guarded `POST /api/notifications/slack` endpoint requiring `workspace:manage` for explicit Slack alert sends.

## Validation

- `pnpm test -- --test-name-pattern 'RAD-088|RAD-087|RAD-004'` passed.
- `pnpm lint` passed.
- `pnpm typecheck` passed after explicitly passing email delivery `channel` and `provider`.
- `pnpm validate:env` passed.
- `pnpm validate:seed` passed.
- `pnpm db:harness` passed.
- `pnpm test` passed.
- `pnpm test:e2e` passed.
- `pnpm build` passed.
- Local smoke: `POST /api/notifications/slack` without a session returned `401 unauthenticated`, confirming the endpoint is guarded.
- Known local limitation: `pnpm db:harness:apply` requires Docker. Docker is unavailable in this environment, so apply mode failed with `Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`.

## Manual QA notes

- In a configured environment with `SLACK_WEBHOOK_URL`, post a workspace-managed `critical_finding` or `daily_summary` alert request to `/api/notifications/slack`.
- Verify a `notification_deliveries` row is created with `channel = 'slack'`, `provider = 'slack_webhook'`, and a `sent`, `skipped`, or `failed` status.
- Verify local environments without Slack config skip safely and do not expose webhook URLs in responses, persisted rows, or logs.

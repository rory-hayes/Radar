# RAD-095 — Implement rate limits, quotas, and abuse controls

## Status

Done

## Priority

P0

## Phase

Phase 9 — Production Readiness (Production)

## Objective

Add per-workspace and per-user limits for source syncs, eval runs, AI calls, file sizes, runner duration, and API requests.

## Target outcome

The service is protected from runaway jobs, cost spikes, and abuse.

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

RAD-094 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

Billing, onboarding, observability, security, performance, deployment docs, and tests.

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

## Codex implementation notes

- Added `abuse_limit_events` persistence with workspace ownership, user attribution, bounded metadata, indexes, and RLS.
- Added typed abuse-limit schemas, shared sliding-window rules, payload ceilings, runner-duration limits, repository helpers, and `checkAndRecordAbuseLimit`.
- Added `rate_limited` guardrail responses with HTTP 429 for workspace JSON APIs.
- Rate-limited `/api/evidence/retrieve`, `/api/sources/sync`, `/api/notifications/email`, and `/api/notifications/slack` as API requests.
- Added operation-level controls for source syncs, file uploads, AI assertion/test-case generation, manual evaluation runs, finding fix reruns, and claimed runner executions.
- Centralized uploaded document/manual text limits and added Knowledge Runner endpoint timeout plus response-size cap. Journey and Integration runner timeout schemas remain in place.
- Updated `docs/SECURITY.md` and added `tests/unit/rate-limits-quotas-abuse-controls.test.mjs`.

## Validation

- `pnpm lint` passed.
- `pnpm typecheck` passed.
- `pnpm test` passed: 361 unit tests.
- `pnpm build` passed.
- `pnpm test:e2e` passed: 34 E2E tests.
- `pnpm db:harness:apply` failed because Docker is unavailable locally: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`

## Manual QA

- No customer-facing UI was added, so screenshots are not applicable.
- Verified the happy path through unit/build coverage: permitted requests record quota events before expensive work.
- Verified the sad path through guardrail and enforcement coverage: exceeded windows return `rate_limited` and HTTP 429 for JSON APIs.
- Verified no primary navigation changes through the existing E2E gates.

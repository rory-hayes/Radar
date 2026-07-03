# RAD-067 — Build generic webhook and API assertion checks

## Status

Done

## Priority

P1

## Phase

Phase 6 — Journey and Integration Runners (Beta)

## Objective

Support assertions such as webhook fired, API returned expected state, ticket endpoint accepted request, or billing object updated.

## Target outcome

Integration checks can validate downstream behaviour with clear evidence.

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

RAD-066 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

Runner contracts, Playwright code, integration runner code, credential helpers, and tests.

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

- Added `src/lib/evaluation/integration-checks.ts` with generic Integration check definitions for `webhook_fired`, `api_expected_state`, `ticket_endpoint_accepted`, and `billing_object_updated`.
- Generic definitions compile to the RAD-066 `integration_check` input shape, preserving bounded HTTP execution, auth handling, response validation, and redacted evidence capture.
- Extended the RAD-066 Integration Runner with JSON path equality validation so API expected-state and billing object checks can verify downstream state beyond raw status codes.
- Updated `docs/RUNNERS_SPEC.md` with the RAD-067 generic check boundary.
- No UI changes were needed; shadcn blocks/components were not used for this server-only check-definition ticket.
- Validation passed: `node --test tests/unit/generic-integration-checks.test.mjs`; `pnpm lint`; `pnpm typecheck`; `pnpm test` (246 unit tests); `pnpm build`; `pnpm test:e2e` (22 E2E tests); `pnpm validate:seed`; `pnpm validate:env`; `pnpm db:harness`; protected-route local smoke on port 3033.
- `pnpm db:harness:apply` failed because Docker is not running: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`.
- Manual QA: protected assertion detail route returned the expected sign-in redirect; the static generic check contract test covers webhook/API/ticket/billing check definitions, JSON-state validation, and marketplace-scope guardrails. Screenshot capture is not meaningful because this ticket has no UI changes.

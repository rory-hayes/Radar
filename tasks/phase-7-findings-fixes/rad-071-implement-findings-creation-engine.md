# RAD-071 — Implement findings creation engine

## Status

Done

## Priority

P1

## Phase

Phase 7 — Findings and Recommended Fixes (Beta)

## Objective

Convert failed/warning evaluation results into deduplicated findings with severity, confidence, impacted assertion, evidence, and first/last seen tracking.

## Target outcome

Repeated failures update existing findings rather than spamming duplicates.

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

RAD-070 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

Findings engine, Findings UI, evidence display, recommended fixes, workflow actions, and tests.

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
- [x] Capture screenshots for UI changes. Not applicable; RAD-071 has no UI changes.

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

- Added `src/lib/findings/creation-engine.ts` as the server-only RAD-071 findings creation boundary.
- Failed and warning `test_case_results` now create findings with severity, confidence, impacted assertion/test case, expected versus actual text, first/last seen timestamps, source/artifact/run-output evidence, and activity.
- Repeated active failures use a workspace-scoped dedupe key and update the existing finding occurrence instead of creating duplicate inbox rows. Resolved, ignored, or false-positive findings are left closed and can be followed by a new finding if the failure returns.
- Wired the engine into persisted Knowledge and Integration runner results. Integration results now attach the redacted HTTP exchange artifact as a result evidence ref.
- Added repository helpers for workspace-scoped lookup by dedupe key and updating an existing finding occurrence.
- Updated `docs/EVAL_ENGINE_SPEC.md` and `docs/DATA_MODEL.md` with the creation-engine contract.
- Added `tests/unit/findings-creation-engine.test.mjs` for creation-engine, runner wiring, repository scoping, evidence mapping, docs, and scope guardrails.
- This is backend/domain work; no shadcn UI components or blocks were applicable.

## Validation

- `node --test tests/unit/findings-creation-engine.test.mjs` passed.
- `pnpm lint` passed.
- `pnpm typecheck` passed.
- `pnpm test` passed.
- `pnpm build` passed.
- `pnpm test:e2e` passed.
- `pnpm validate:seed` passed.
- `pnpm validate:env` passed.
- `pnpm db:harness` passed.
- `pnpm db:harness:apply` failed because Docker is not running locally: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`.
- Production smoke with `pnpm start --port 3071` passed: `curl -I /assertions/00000000-0000-0000-0000-000000000000` returned `307 Temporary Redirect` to `/sign-in`.

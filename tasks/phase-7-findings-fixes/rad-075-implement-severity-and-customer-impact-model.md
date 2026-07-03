# RAD-075 — Implement severity and customer impact model

## Status

Done

## Priority

P1

## Phase

Phase 7 — Findings and Recommended Fixes (Beta)

## Objective

Add severity rules that combine assertion priority, failure type, affected journey, confidence, repeat count, and customer-facing impact.

## Target outcome

Findings are prioritized by business risk, not just technical failure.

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

RAD-074 should be complete or deliberately skipped with notes.

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
- [x] Capture screenshots for UI changes. Not applicable; RAD-075 has no UI changes.

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

- Added `src/lib/findings/severity-impact-model.ts` as the server-only RAD-075 risk model.
- Severity now combines assertion priority, failed versus warning status, runner type, Journey impact, confidence, repeat count, customer-facing terms, and explicit blocker/error signals.
- Customer impact text now explains affected assertion/test case, runner type, repeat count, confidence, and customer-facing signal in business-readable language.
- Finding creation now writes `severityImpactModelVersion`, `impactLevel`, `repeatCount`, and `riskFactors` into finding metadata and increments repeat count for active deduped findings.
- Finding repository responses now expose bounded metadata so repeat-aware scoring can use existing finding state.
- Updated `docs/EVAL_ENGINE_SPEC.md` and `docs/DATA_MODEL.md`.
- Added `tests/unit/severity-impact-model.test.mjs`.
- No shadcn work was applicable; this was backend/domain logic.

## Validation

- `node --test tests/unit/severity-impact-model.test.mjs tests/unit/findings-creation-engine.test.mjs` passed.
- `pnpm lint` passed.
- `pnpm typecheck` passed.
- `pnpm test` passed.
- `pnpm build` passed.
- `pnpm test:e2e` passed.
- `pnpm validate:seed` passed.
- `pnpm validate:env` passed.
- `pnpm db:harness` passed.
- `pnpm db:harness:apply` failed because Docker is not running locally: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`.
- Production smoke with `pnpm start --port 3075` passed: `curl -I /findings` returned `307 Temporary Redirect` to `/sign-in?next=%2Ffindings`.

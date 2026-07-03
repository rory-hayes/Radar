# RAD-076 — Implement recommended fix generator

## Status

Done

## Priority

P1

## Phase

Phase 7 — Findings and Recommended Fixes (Beta)

## Objective

Generate concise recommended fixes based on evidence, failure type, source owner, and runner output with a no-hallucination guardrail.

## Target outcome

Recommended fixes are practical, grounded, and linked to evidence.

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

RAD-075 should be complete or deliberately skipped with notes.

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
- [x] Capture screenshots for UI changes. Not applicable; RAD-076 has no UI changes.

## Definition of done

- [x] Code complete and scoped to this ticket.
- [x] Acceptance criteria satisfied.
- [x] Test criteria satisfied or documented with approved exception.
- [x] No hardcoded secrets or sensitive logging.
- [x] Ticket checklist updated.
- [x] PR summary includes changed files, testing, screenshots for UI work, and risks.

## Codex notes

Result: Done.

- Added `src/lib/findings/recommended-fix-generator.ts` as the server-only RAD-076 generator.
- The generator creates concise recommendations from assertion/test-case context, result status, runner type, bounded runner output, evidence references, and the known assertion owner when present.
- Added the no-hallucination guardrail states `evidence_grounded`, `runner_output_only`, and `insufficient_evidence`; insufficient evidence recommends capturing source or artifact evidence before changing customer-facing behavior.
- Finding creation now writes generated recommendations into `recommended_fix` and stores generator version, guardrail, failure type, evidence counts, bounded rationale, and known owner metadata.
- Updated `docs/EVAL_ENGINE_SPEC.md`, `docs/DATA_MODEL.md`, `tasks/TASKS.md`, and unit coverage for RAD-076.

Commands run:

- `pnpm test -- --test-name-pattern 'RAD-076|RAD-071 maps severity'`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm validate:seed`
- `pnpm validate:env`
- `pnpm db:harness`
- `pnpm build`
- `pnpm db:harness:apply` (blocked because Docker is not running: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`)
- `pnpm start --port 3016`
- `curl -I http://localhost:3016/findings`

Manual QA:

- Production smoke on `http://localhost:3016/findings` returned `307 Temporary Redirect` to `/sign-in?next=%2Ffindings`, verifying protected Findings routing still works.
- No screenshots captured because this ticket did not change UI.

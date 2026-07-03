# RAD-039 — Implement affected assertion detection

## Status

Done

## Priority

P0

## Phase

Phase 3 — Sources and Evidence (MVP)

## Objective

Link sources to assertions and identify which assertions should rerun when a source changes, including manual and auto-generated relationships.

## Target outcome

A changed source produces a clear list of impacted assertions.

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

RAD-038 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

Sources UI, ingestion jobs, extraction utilities, storage helpers, repositories, and tests.

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

## Implementation report

Result: Done. Added durable assertion-source relationship provenance (`manual` or `auto_generated`) and a source-change impact detector that combines linked sources, assertion status, and source-change schedule preferences.

Changed files:

- `supabase/migrations/20260703113000_add_assertion_source_change_detection.sql`
- `src/lib/assertions/schema.ts`
- `src/lib/validation/schemas.ts`
- `src/lib/repositories/assertions.ts`
- `src/lib/sources/affected-assertions.ts`
- `src/lib/sources/source-sync-jobs.ts`
- `supabase/seeds/radar-demo-workspace.sql`
- `docs/DATA_MODEL.md`
- `docs/SOURCES_AND_EVIDENCE.md`
- `tests/unit/affected-assertion-detection.test.mjs`
- `tests/unit/assertions-schema.test.mjs`
- `tests/unit/source-sync-jobs.test.mjs`

Manual QA:

- Happy path: changed source syncs now call `detectAffectedAssertionsForSourceChange` and return affected assertions plus `rerunCandidateCount`.
- Sad path: unchanged, skipped, or failed syncs do not return rerun candidates.
- Navigation scope: no primary navigation or pages were added; this is backend/source workflow infrastructure only.
- Screenshots: not applicable; no UI surface changed.

Commands run:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`
- `pnpm validate:seed`
- `pnpm validate:env`
- `pnpm db:harness`
- `pnpm db:harness:apply` (blocked because Docker daemon is not running)

Risk / follow-up:

- This ticket identifies rerun candidates only. Actual evaluation job queueing remains scoped to the later evaluation orchestration/manual trigger tickets.

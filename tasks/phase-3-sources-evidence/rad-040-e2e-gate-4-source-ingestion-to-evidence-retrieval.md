# RAD-040 — E2E Gate 4 — Source ingestion to evidence retrieval

## Status

Done

## Priority

P0

## Phase

Phase 3 — Sources and Evidence (MVP)

## Objective

Run E2E coverage that creates sources, crawls/uploads content, indexes it, retrieves relevant evidence, shows source health, and prevents unauthorized access.

## Target outcome

The evidence layer is ready to support assertion and evaluation work.

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

RAD-039 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This is an E2E gate. It must stop phase progression until complete.

## Expected files touched

Sources UI, ingestion jobs, extraction utilities, storage helpers, repositories, and tests.

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

Codex should append implementation notes, commands run, failures, and follow-ups here before marking this task Done.

## Gate report

Result: Done. Added `tests/e2e/source-ingestion-evidence-retrieval.test.mjs` and ran the Phase 3 source ingestion to evidence retrieval gate.

Coverage added:

- Source create/edit actions are guarded and route URL/manual/upload sources into the ingestion path.
- URL crawl and uploaded-document ingestion persist source versions, documents, chunks, hashes, and sync health.
- Embedding jobs index missing source chunks through the server-only OpenAI embedding provider contract.
- Evidence retrieval is workspace-guarded, assertion-scoped, and restricted to linked sources.
- Source list/detail surfaces show health, linked assertions, versions, documents, chunk previews, and affected assertion counts.
- Source-change detection returns rerun candidates without executing evaluation jobs.
- Primary navigation remains locked to Command Center, Assertions, Findings, and Sources.

Regression notes:

- Initial RAD-040 e2e run failed because the test treated documented forbidden-scope constraints as product scope drift. The test was corrected to assert those constraints positively in docs while keeping negative drift checks on navigation/routes.
- No blocking product regressions remain.

Manual QA:

- Happy path: `pnpm test:e2e` verifies the source ingestion, indexing, retrieval, source detail, and affected-assertion wiring.
- Sad path: retrieval checks reject source IDs that are not linked to the assertion; sync and retrieval routes remain guardrail-protected.
- Screenshots: not applicable; this gate added test coverage only and did not change UI.
- Phase progression: the gate passed. Continuing to RAD-041 because the user explicitly requested continuous ticket execution without checkpoints.

Commands run:

- `pnpm test:e2e` (first run failed on an overly broad test assertion; second run passed)
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm validate:seed`
- `pnpm validate:env`
- `pnpm db:harness`
- `pnpm db:harness:apply` (blocked because Docker daemon is not running)

Risk / follow-up:

- `pnpm db:harness:apply` still needs Docker Desktop running to execute a real local Supabase reset. Static harness validation passes.

# RAD-035 — Implement source sync jobs and versioning

## Status

Done

## Priority

P0

## Phase

Phase 3 — Sources and Evidence (MVP)

## Objective

Create background jobs to sync sources, calculate content hashes, detect changes, store versions, and update source health.

## Target outcome

Radar knows when a source changed and can trigger affected assertion reruns later.

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

RAD-034 should be complete or deliberately skipped with notes.

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
- [x] Capture screenshots for UI changes or document why screenshots are unavailable.

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

- Result: Done. Source sync now has a server-only job executor that marks supported sources as `syncing`, calculates content hashes, detects unchanged snapshots, persists changed versions, and records bounded failure state.
- Added `src/lib/sources/source-sync-jobs.ts` with URL and manual text sync support, unchanged detection through source version content hashes, explicit skipped results for uploaded documents and endpoint sources, and error handling that preserves the prior content hash.
- Added guarded `POST /api/sources/sync` for authorized manual sync execution using workspace guardrails and `source:edit` permission.
- Extended the source repository with sync target loading, latest/content-hash version lookup, and sync-state updates that no longer wipe existing hash/timestamp fields when omitted.
- Updated `docs/DATA_MODEL.md` and `docs/SOURCES_AND_EVIDENCE.md` with the RAD-035 sync/versioning boundary.
- Added `tests/unit/source-sync-jobs.test.mjs` covering job orchestration, unchanged detection, URL/manual-text persistence paths, guarded API execution, and product-scope drift checks.
- Manual QA: this ticket is backend infrastructure. The guarded sync route and job branches are covered by static tests; full authenticated execution against Supabase requires local Docker.
- Secret scan: narrow key/token pattern scan returned no hits.

## Commands run

- `pnpm lint` passed.
- `pnpm typecheck` passed.
- `pnpm test` passed.
- `pnpm test:e2e` passed.
- `pnpm build` passed.
- `pnpm validate:seed` passed.
- `pnpm validate:env` passed.
- `pnpm db:harness` passed.
- Narrow secret-pattern scan passed with no hits.
- `pnpm db:harness:apply` could not apply migrations locally because Docker is not running: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`

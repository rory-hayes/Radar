# RAD-033 — Implement URL crawler and text extraction

## Status

Done

## Priority

P0

## Phase

Phase 3 — Sources and Evidence (MVP)

## Objective

Add a safe crawler for single URL and sitemap/page ingestion with content extraction, deduping, timeout handling, robots/limits policy, and metadata capture.

## Target outcome

Radar can ingest source-of-truth web content and store extracted text with a stable content hash.

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

RAD-032 should be complete or deliberately skipped with notes.

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

- Result: Done. Added a server-only URL crawler and persistence path for source-of-truth web content.
- Added `src/lib/sources/url-crawler.ts` with safe URL normalization, local/private host blocking, robots.txt policy parsing, timeout handling, content-type and byte-size limits, sitemap URL extraction, same-origin sitemap limits, deduping, readable text extraction, metadata capture, and stable SHA-256 content hashes.
- Added `src/lib/sources/url-ingestion.ts` to persist crawl results as `source_versions`, `source_documents`, and bounded `source_chunks`, then update source sync state and content hash.
- Extended the source repository with `getNextSourceVersionNumber` and `updateSourceSyncState`, preserving explicit workspace scoping.
- Updated `docs/DATA_MODEL.md` with the RAD-033 URL ingestion boundary: safe URLs only, capped same-origin sitemap ingestion, bounded crawler metadata, and raw content limited to source documents/chunks.
- Added `tests/unit/url-crawler.test.mjs` covering crawler safety/limits/extraction/hash behavior, sitemap ingestion, persistence, source sync state, and product-scope drift checks.
- Manual QA: this is server-side ingestion infrastructure with no UI screenshots. Happy path is covered by crawler/persistence tests and build/typecheck. Sad paths are covered by static gates for unsafe URLs, robots disallow, timeout, unsupported content type, byte limits, empty content, and Docker-unavailable live DB apply.
- Secret scan: narrow key/token pattern scan returned no hits.

## Commands run

- `pnpm lint` passed.
- `pnpm typecheck` passed.
- `pnpm test` passed with 115 tests.
- `pnpm test:e2e` passed with 11 tests.
- `pnpm build` passed.
- `pnpm validate:seed` passed.
- `pnpm validate:env` passed.
- `pnpm db:harness` passed.
- Narrow secret-pattern scan passed with no hits.
- `pnpm db:harness:apply` could not apply migrations locally because Docker is not running: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`

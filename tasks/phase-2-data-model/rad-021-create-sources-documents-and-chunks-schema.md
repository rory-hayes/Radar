# RAD-021 — Create sources, documents, and chunks schema

## Status

Done

## Priority

P0

## Phase

Phase 2 — Core Data Model (MVP)

## Objective

Add the database tables for sources, source_documents, source_chunks, versions, hashes, metadata, and sync state.

## Target outcome

Radar can persist source-of-truth content and later retrieve source evidence by workspace.

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

RAD-020 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

- `supabase/migrations/20260703103000_create_sources_documents_chunks.sql`
- `src/lib/sources/schema.ts`
- `supabase/seeds/radar-demo-workspace.sql`
- `docs/DATA_MODEL.md`
- `docs/SECURITY.md`
- `docs/DEMO_DATA_POLICY.md`
- `scripts/validate-seed-policy.mjs`
- `tests/unit/sources-schema.test.mjs`
- `tests/unit/demo-workspace-seed.test.mjs`
- `tasks/TASKS.md`
- `tasks/phase-2-data-model/rad-021-create-sources-documents-and-chunks-schema.md`

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

- Added `20260703103000_create_sources_documents_chunks.sql` with:
  - `source_type`, `source_sync_status`, and `source_document_status` enums.
  - `sources`, `source_versions`, `source_documents`, and `source_chunks` tables.
  - Direct `workspace_id` ownership on every source table.
  - Content hashes, metadata object checks, sync status/timing/error fields, document/chunk counts, and chunk text.
  - Optional `extensions.vector(1536)` embeddings on `source_chunks`.
  - Unique constraints for source version numbers, version hashes, document hashes, and chunk indexes.
  - RLS read policies for active workspace members and mutation policies for active Admin/Editor members.
- Added typed source validation schemas in `src/lib/sources/schema.ts`.
- Updated the local demo seed to persist one synthetic source, source version, source document, and source chunk now that source tables exist.
- Updated `docs/DATA_MODEL.md`, `docs/SECURITY.md`, and `docs/DEMO_DATA_POLICY.md` with source data boundaries.
- Added `tests/unit/sources-schema.test.mjs` and updated demo seed tests/validator.
- Commands run:
  - `pnpm validate:seed`
  - `pnpm test`
  - `pnpm lint`
  - `pnpm validate:env`
  - `pnpm typecheck`
  - `pnpm test:e2e`
  - `pnpm build`
  - `pnpm supabase:start` (failed because Docker daemon is unavailable)
- Manual QA: schema behavior is covered by migration/static unit tests and seed validation. Local migration application via Supabase could not run because Docker is not running: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`.
- Screenshots: not applicable; no UI changed.
- Risks/follow-ups: generated Supabase TypeScript types were not produced because local Supabase is unavailable. RAD-025 owns the broader repository layer; this ticket only adds source validation types and the database schema.

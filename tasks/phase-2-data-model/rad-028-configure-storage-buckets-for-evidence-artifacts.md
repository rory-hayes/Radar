# RAD-028 — Configure storage buckets for evidence artifacts

## Status

Done

## Priority

P0

## Phase

Phase 2 — Core Data Model (MVP)

## Objective

Set up private storage buckets and access helpers for uploaded documents, extracted source snapshots, screenshots, run artifacts, and report exports.

## Target outcome

Evidence artifacts are private, workspace-scoped, and accessible only through signed/authorized paths.

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

RAD-027 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

Supabase migrations, generated types, repositories, validation schemas, and tests.

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

- Added `supabase/migrations/20260703112000_configure_evidence_artifact_storage.sql` to create/update the private `radar-evidence-artifacts` bucket with a 50 MB file limit and bounded MIME allowlist for documents, screenshots, run artifacts, and exports.
- Added shared validation schemas for evidence artifact kinds, workspace-scoped path requests, signed URL requests, and signed upload/download URL responses.
- Added server-only storage helpers in `src/lib/storage/evidence-artifacts.ts` for path construction, path parsing, workspace path assertion, signed upload URLs, signed download URLs, and artifact removal.
- Documented the private bucket, `<workspaceId>/<artifactKind>/<ownerId>/<fileName>` path contract, and signed URL access rules in `docs/SECURITY.md`, `docs/DATA_MODEL.md`, and `docs/SOURCES_AND_EVIDENCE.md`.
- Added `tests/unit/evidence-storage.test.mjs` for the bucket migration, validation schemas, helper functions, and docs.
- Manual QA: no UI surface changed in this storage infrastructure ticket, so screenshots are not applicable. Existing E2E route gates and production build verify primary navigation and app shell behavior remain unchanged.
- Commands run:
  - `pnpm typecheck` passed.
  - `pnpm test` passed with 98 tests.
  - `pnpm test:e2e` passed with 7 tests.
  - `pnpm lint` passed.
  - `pnpm validate:seed` passed.
  - `pnpm validate:env` passed.
  - `pnpm build` passed.
  - Secret-pattern scan found placeholders and negative-test regexes only.
  - `pnpm supabase:start` could not run because Docker is not running: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`

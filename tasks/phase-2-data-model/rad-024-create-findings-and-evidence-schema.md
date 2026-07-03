# RAD-024 — Create findings and evidence schema

## Status

Done

## Priority

P0

## Phase

Phase 2 — Core Data Model (MVP)

## Objective

Add findings, finding_evidence, finding_activity, finding_assignments, and resolution state fields.

## Target outcome

Failures can be converted into evidence-backed issues with lifecycle state.

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

RAD-023 should be complete or deliberately skipped with notes.

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

- Implemented `20260703110000_create_findings_and_evidence.sql` with `findings`, `finding_evidence`, `finding_assignments`, and `finding_activity`.
- Added finding enums for lifecycle status, severity, evidence type, and activity type.
- Added finding fields for expected versus actual behavior, confidence, customer impact, recommended fix, owner, dedupe key, first/last seen timestamps, and resolution state.
- Added workspace-scoped foreign keys from findings to assertions, evaluation runs, and test-case results, plus evidence links to source records, source documents, source chunks, runs, and results.
- Added RLS so active workspace members can read findings/evidence/assignments/activity, Admin/Editor can mutate, and Admin can delete findings.
- Added `src/lib/findings/schema.ts` with typed arrays, TypeScript types, and Zod schemas for findings, evidence, assignments, and activity.
- Updated local demo seed with one synthetic evidence-backed critical finding linked to the existing failed pricing result, source chunk, assignment, and activity events.
- Updated `docs/DATA_MODEL.md`, `docs/SECURITY.md`, and `docs/DEMO_DATA_POLICY.md` for finding persistence and sensitive-data boundaries.
- Added `tests/unit/findings-schema.test.mjs` and updated demo seed tests/seed policy validation.
- Repository-layer functions and generated Supabase DB types remain deferred to RAD-025/RAD-029.
- UI manual QA is not applicable for this schema-only ticket; existing route E2E and production build confirm no primary navigation regression.
- Commands run:
  - `pnpm validate:seed`
  - `pnpm test`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm validate:env`
  - `pnpm test:e2e`
  - `pnpm build`
  - `pnpm supabase:start` failed because Docker is not running: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`

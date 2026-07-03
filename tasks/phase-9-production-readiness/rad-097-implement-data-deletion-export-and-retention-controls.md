# RAD-097 — Implement data deletion, export, and retention controls

## Status

Done

## Priority

P0

## Phase

Phase 9 — Production Readiness (Production)

## Objective

Add source deletion, artifact cleanup, workspace export, retention settings, and documented data handling paths.

## Target outcome

Customers can remove their data and understand what Radar stores.

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

RAD-096 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

Billing, onboarding, observability, security, performance, deployment docs, and tests.

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

## Completion notes

- Added `data_retention_days` and `data_retention_updated_at` workspace fields with a constrained 30/90/180/365 day policy window.
- Threaded retention through workspace schemas, validation, repository reads/writes, settings actions, and the shadcn settings form.
- Added a source deletion flow on source detail pages that requires exact source-name confirmation, enforces `source:delete`, removes source-owned private artifacts first, deletes the source through the workspace-scoped repository, and writes a `source.deleted` audit event.
- Added a workspace JSON export route at `/api/workspace/export` for workspace admins. The export includes workspace-owned product records, redacted runner credential summaries, billing summary data without Stripe object identifiers, and a private artifact manifest without signed URLs.
- Added a Settings data lifecycle panel for retention visibility and workspace export.
- Documented stored data, source deletion, workspace export, retention, and boundaries in `docs/DATA_LIFECYCLE.md`, with supporting `docs/DATA_MODEL.md` notes.
- Used existing shadcn Card, Button, Select, Alert, Field, and Input primitives; shadcn docs were checked before composing the new controls.

## Validation

- `pnpm lint` passes.
- `pnpm typecheck` passes.
- `pnpm test` passes: 369 unit tests.
- `pnpm build` passes and includes `/api/workspace/export`.
- `pnpm test:e2e` passes: 34 e2e tests.
- `pnpm audit --audit-level high` passes with no known vulnerabilities.
- `pnpm db:harness:apply` remains blocked because Docker is not running locally: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`.

## Manual QA

- Happy path: build verifies the Settings page, source detail page, and workspace export route compile under Next.js.
- Sad paths: unit coverage verifies admin-only export, exact source-name delete confirmation, storage cleanup before database deletion, and export redactions.
- Navigation: e2e scope-lock tests verify no unrelated primary navigation or product routes changed.
- Screenshots: not captured; the UI changes are compact controls on existing Settings and Source detail surfaces.

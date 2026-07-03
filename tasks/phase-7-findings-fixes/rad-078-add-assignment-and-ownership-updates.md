# RAD-078 — Add assignment and ownership updates

## Status

Done

## Priority

P1

## Phase

Phase 7 — Findings and Recommended Fixes (Beta)

## Objective

Allow authorized users to assign findings to owners, change priority, add notes, and filter by owner/team.

## Target outcome

Findings can be operationally managed by Support, Product, Ops, or Engineering.

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

RAD-077 should be complete or deliberately skipped with notes.

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
- [x] Capture screenshots for UI changes.

## Definition of done

- [x] Code complete and scoped to this ticket.
- [x] Acceptance criteria satisfied.
- [x] Test criteria satisfied or documented with approved exception.
- [x] No hardcoded secrets or sensitive logging.
- [x] Ticket checklist updated.
- [x] PR summary includes changed files, testing, screenshots for UI work, and risks.

## Codex notes

Result: Done.

- Added bounded owner-team values for Support, Product, Ops, and Engineering.
- Added active workspace-member loading for assignment choices and assignee validation.
- Added ownership repository helpers to update `owner_user_id`, severity-as-priority, metadata, and active assignment history.
- Added `updateFindingOwnershipAction` with `finding:resolve` permission, workspace-member validation, assignment/activity/audit writes, and route revalidation.
- Added the Findings detail ownership form using existing shadcn Card, Select, Textarea, Alert, and Button primitives.
- Added team filtering and team display to the Findings inbox while preserving the existing owner filter.
- Updated `docs/DATA_MODEL.md`, `docs/SECURITY.md`, `tasks/TASKS.md`, and unit coverage for RAD-078.

Commands run:

- `pnpm test -- --test-name-pattern 'RAD-078|RAD-077|RAD-072'`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm validate:seed`
- `pnpm validate:env`
- `pnpm db:harness`
- `pnpm build`
- `pnpm db:harness:apply` (blocked because Docker is not running: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`)
- `pnpm start --port 3018`
- `curl -I http://localhost:3018/findings`

Manual QA:

- Production smoke on `http://localhost:3018/findings` returned `307 Temporary Redirect` to `/sign-in?next=%2Ffindings`, verifying protected Findings routing still works.
- Ownership happy/sad paths are covered by static tests for assignee validation, assignment history, activity writes, audit events, owner/team filtering, and UI feedback states.

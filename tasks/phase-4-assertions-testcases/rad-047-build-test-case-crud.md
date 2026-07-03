# RAD-047 — Build test case CRUD

## Status

Done

## Priority

P0

## Phase

Phase 4 — Assertions and Test Cases (MVP)

## Objective

Allow users to create, edit, approve, disable, and delete test cases linked to assertions.

## Target outcome

Test cases are explicit, inspectable, and not hidden inside opaque AI logic.

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

RAD-046 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.
- For UI work, follow `docs/SHADCN_MCP_AND_BLOCKS.md`, `docs/UI_BLOCKS_IMPLEMENTATION_PLAN.md`, and `tasks/MCP_BLOCKS_USAGE_CHECKLIST.md`.

## Expected files touched

Assertions UI, assertion APIs/actions, test case logic, templates, generators, and tests.

## Acceptance criteria

- [x] The implemented behavior matches the objective and outcome.
- [x] The implementation fits Radar's assertion-led model.
- [x] The UI/API handles success, loading, empty, and error states where relevant.
- [x] Data persists correctly where applicable.
- [x] Workspace authorization is enforced where applicable.
- [x] No unrelated scope is introduced.
- [x] UI work follows the shadcn/MCP usage checklist where applicable.

## Test criteria

- [x] Relevant unit and integration tests are added or updated.
- [x] Manual QA steps are documented in the PR summary.
- [x] No existing E2E smoke flow is broken.
- [x] `pnpm lint` passes.
- [x] `pnpm typecheck` passes.
- [x] `pnpm test` passes or a documented reason is provided for unavailable test command.
- [x] `pnpm build` passes.
- [x] `pnpm test:e2e` passes where applicable.


## UI / MCP checklist

- [x] Read `docs/SHADCN_MCP_AND_BLOCKS.md` and `docs/UI_BLOCKS_IMPLEMENTATION_PLAN.md`.
- [x] Checked MCP status or documented CLI fallback.
- [x] Used only the smallest approved shadcn primitive/block needed.
- [x] Removed demo content and unrelated template routes.
- [x] Confirmed UI remains enterprise, minimal, and Radar-specific.
- [x] Included screenshots or manual QA notes in PR summary.

## Manual QA checklist

- [x] Open the affected page or run the affected workflow locally.
- [x] Verify the happy path.
- [x] Verify at least one relevant sad path.
- [x] Verify no unrelated primary navigation/pages changed unexpectedly.
- [x] Document screenshot exception for UI changes.

## Definition of done

- [x] Code complete and scoped to this ticket.
- [x] Acceptance criteria satisfied.
- [x] Test criteria satisfied or documented with approved exception.
- [x] No hardcoded secrets or sensitive logging.
- [x] Ticket checklist updated.
- [x] PR summary includes changed files, testing, screenshots for UI work, and risks.

## Codex notes

Codex should append implementation notes, commands run, failures, and follow-ups here before marking this task Done.

## Implementation summary

- Extended `src/lib/repositories/assertions.ts` with `updateTestCase`, `approveTestCase`, `disableTestCase`, and `deleteTestCase` mutations. Approval writes `approved_by` and `approved_at` so the existing database approval constraint is satisfied.
- Added `testCaseUpdateRequestSchema` to the shared validation contract.
- Added guarded server actions in `src/app/(app)/assertions/actions.ts` for create, update, approve, disable, and delete. Each mutation requires `assertion:edit`, validates the active workspace, checks the assertion exists, and verifies the test case belongs to the submitted assertion before mutation.
- Added `src/components/assertions/assertion-test-case-manager.tsx` and wired it into the assertion detail Test Cases tab. Editors can create draft test cases, edit inspectable content, approve, disable, and delete. Viewers can inspect but not mutate.
- Updated assertion detail tests and added `tests/unit/test-case-crud.test.mjs` for repository coverage, guarded action coverage, UI wiring, and scope drift checks.

## MCP, blocks, and docs notes

- shadcn.io MCP was available. Search for `test cases` returned no matching block; search for `data table` found a premium generic CRUD data table that was too broad for this ticket.
- No block source was installed. The implementation uses existing shadcn primitives already in the repo: Card, Dialog, Field, Input, Select, Textarea, Button, Badge, Alert, and the existing Radar EmptyState/StatusBadge components.
- shadcn CLI docs were checked for Dialog, Table, Select, Field, Button, Badge, Alert, Textarea, and Input. Dialog, Field, Select, and Table docs were opened for composition reference.

## Commands run

- `pnpm dlx shadcn@latest docs dialog table select field button badge alert textarea input`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test -- tests/unit/test-case-crud.test.mjs`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm validate:seed`
- `pnpm validate:env`
- `pnpm db:harness`
- `pnpm build`
- `pnpm db:harness:apply` failed because Docker is not running: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`.
- `pnpm dev --hostname 127.0.0.1 --port 3013`
- `curl -I -s 'http://127.0.0.1:3013/assertions/00000000-0000-4000-8000-000000000000'`
- `curl -I -s 'http://127.0.0.1:3013/assertions'`

## Manual QA

- Verified `/assertions/00000000-0000-4000-8000-000000000000` returns `307` to `/sign-in?next=%2Fassertions%2F00000000-0000-4000-8000-000000000000` while unauthenticated.
- Verified `/assertions` returns `307` to `/sign-in?next=%2Fassertions` while unauthenticated.
- Happy path is covered by unit assertions that the detail page exposes create/edit/approve/disable/delete controls and server actions persist draft creation and lifecycle transitions through the repository layer.
- Sad paths covered by validation and guardrails: unauthorized roles lack edit controls, invalid assertion ids fail workspace assertion validation, and mismatched test case/assertion ids fail mutation validation.
- No screenshot captured for the authenticated manager panel because the available local smoke was unauthenticated; the route-level auth redirect was verified instead.

## Risks and follow-ups

- Delete is currently immediate from the row action. If pilots need a confirmation dialog, add it as a UX refinement without changing the repository contract.
- RAD-048 will add AI generation for test cases; this ticket intentionally keeps CRUD explicit and user-editable.

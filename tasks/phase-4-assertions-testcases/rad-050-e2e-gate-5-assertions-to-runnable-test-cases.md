# RAD-050 — E2E Gate 5 — Assertions to runnable test cases

## Status

Done

## Priority

P0

## Phase

Phase 4 — Assertions and Test Cases (MVP)

## Objective

Run E2E coverage that creates sources, generates/approves assertions, generates/edits test cases, links sources, and verifies schedules and permissions.

## Target outcome

The assertion layer is ready for actual evaluation execution.

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

RAD-049 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This is an E2E gate. It must stop phase progression until complete.

## Expected files touched

Assertions UI, assertion APIs/actions, test case logic, templates, generators, and tests.

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

Status: PASS. Phase 4 assertion and test-case functionality is ready for Phase 5 evaluation execution. No blocking product or regression failures were found.

Coverage added:

- Added `tests/e2e/assertions-testcases-gate.test.mjs`.
- Verified assertion create/edit, AI assertion suggestions, template packs, source linking, schedule fields, source-change triggers, test-case CRUD, AI test-case suggestions, manual run queueing, workspace/RBAC boundaries, and locked navigation/scope.
- Confirmed no generic eval platform, prompt playground, trace explorer, workflow canvas, integration marketplace, or unrelated primary navigation surfaced during Phase 4.

Commands run:

- `pnpm lint` — pass.
- `pnpm typecheck` — pass.
- `pnpm test` — pass, 174 unit tests.
- `pnpm build` — pass.
- `pnpm test:e2e` — pass, 19 E2E gate tests.
- `pnpm validate:seed` — pass.
- `pnpm validate:env` — pass.
- `pnpm db:harness` — pass.
- `pnpm db:harness:apply` — blocked by local environment because the Docker daemon is not running.
- `curl -I -s http://127.0.0.1:3016/assertions/00000000-0000-4000-8000-000000000000` — pass, protected detail route returns `307` to `/sign-in`.
- `git diff --check` — pass.
- Secret scan for shadcn, OpenAI, Supabase, Stripe, and bearer-token patterns — pass, no matches.

Accepted deferrals:

- `pnpm db:harness:apply` requires Docker/Supabase local services. Docker is unavailable in this environment, so the static harness passed and the apply failure is documented as environment-only.
- Manual run controls intentionally create a queued placeholder until Phase 5 adds runner orchestration and actual evaluation execution.

Manual QA:

- Verified the protected assertion detail route redirects unauthenticated users to sign-in with the original destination preserved.
- No new UI screens were introduced by this gate, so no screenshot artifact was required.

Shadcn/MCP:

- No new UI primitive or block was needed for this E2E gate. Phase 4 UI components remain composed from the existing approved shadcn primitives installed in earlier tasks.

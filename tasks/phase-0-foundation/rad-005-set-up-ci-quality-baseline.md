# RAD-005 — Set up CI quality baseline

## Status

Done

## Priority

P0

## Phase

Phase 0 — Foundation (MVP)

## Objective

Add GitHub Actions or equivalent CI checks for install, lint, typecheck, unit tests, and build so every Codex PR is automatically gated.

## Target outcome

A pull request cannot be considered complete unless CI runs lint, typecheck, tests, and build successfully.

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

RAD-004 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

package/config/app shell/docs/test files as required by the task.

## Acceptance criteria

- [x] The implemented behavior matches the objective and outcome.
- [x] The implementation fits Radar's assertion-led model.
- [x] The UI/API handles success, loading, empty, and error states where relevant. No UI/API behavior changed in this CI-only ticket.
- [x] Data persists correctly where applicable. No persistence path changed.
- [x] Workspace authorization is enforced where applicable. No authorization path changed.
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
- [x] Capture screenshots for UI changes. Not applicable; no UI changed.

## Definition of done

- [x] Code complete and scoped to this ticket.
- [x] Acceptance criteria satisfied.
- [x] Test criteria satisfied or documented with approved exception.
- [x] No hardcoded secrets or sensitive logging.
- [x] Ticket checklist updated.
- [x] PR summary includes changed files, testing, screenshots for UI work, and risks.

## Codex notes

Implemented CI quality baseline:

- Added `.github/workflows/ci.yml`.
- The workflow runs on pull requests and pushes to `main`/`master`.
- The workflow uses Node 24, pnpm 11.7.0, dependency caching, read-only contents permission, and concurrency cancellation.
- CI runs `pnpm install --frozen-lockfile`, `pnpm validate:env`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, and `pnpm build`.
- CI sets `RADAR_ENV=local` so foundation CI does not require real service secrets.
- CI sets `NAPI_RS_FORCE_WASI=true` so Tailwind uses the same native-binary-safe path as local Codex builds.
- Added `tests/unit/ci-workflow.test.mjs` to lock the required workflow commands and safety settings.
- Documented CI gates in `README.md`.

Commands run:

- `pnpm validate:env` — passed.
- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm test` — passed, 14 unit tests.
- `pnpm test:e2e` — passed, 3 smoke tests.
- `pnpm build` — passed. Next still logs the known local SWC native-loader warning and falls back to WASM; Tailwind still runs through WASI.

Follow-ups:

- Once the repository is pushed to GitHub, verify the workflow runs on the first PR or push.

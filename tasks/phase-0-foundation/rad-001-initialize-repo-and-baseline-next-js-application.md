# RAD-001 — Initialize repo and baseline Next.js application

## Status

Review

## Priority

P0

## Phase

Phase 0 — Foundation (MVP)

## Objective

Create or normalize the project foundation so Radar has a clean Next.js application structure, package scripts, TypeScript config, and predictable local development workflow.

## Target outcome

A developer can install dependencies, run the app locally, and see a clean Radar placeholder without runtime errors.

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

None.

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
- [x] The UI/API handles success, loading, empty, and error states where relevant.
- [x] Data persists correctly where applicable. Not applicable for RAD-001 because no persistence layer is introduced.
- [x] Workspace authorization is enforced where applicable. Not applicable for RAD-001 because no authenticated workspace routes or data access are introduced.
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

Codex should append implementation notes, commands run, failures, and follow-ups here before marking this task ready for review.

### RAD-001 implementation notes

- Branch: `codex/rad-001-baseline-next-app`.
- Added a minimal Next.js app-router foundation with strict TypeScript, ESLint, pnpm lockfile, local scripts, and webpack-backed Next dev/build commands.
- Added the root Radar placeholder only. No app route structure was introduced ahead of RAD-007.
- Added typed product-contract constants for the four locked pages, the three approved runner types, and explicit non-goals.
- Added loading, error, and not-found route states for the baseline app.
- Added Node built-in unit tests and E2E smoke tests without adding a native-binding test runner.
- Updated README with the local development workflow.

### Commands run

- `pnpm install --fetch-timeout=600000`
- `pnpm approve-builds sharp unrs-resolver`
- `pnpm peers check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm exec next dev --webpack -p 3000`
- `curl -i http://localhost:3000/`
- `curl -i http://localhost:3000/not-a-real-route`
- `pnpm exec next start -p 3001`

### Failures fixed

- Initial package install timed out while downloading `next`; reran install with a longer fetch timeout.
- pnpm 11 required explicit build-script approval for `sharp` and `unrs-resolver`; approved only those reported packages.
- ESLint 10 was incompatible with the current Next eslint plugin peer range; pinned ESLint to the compatible 9.x line.
- Vitest 4 pulled a native Rolldown binding rejected by local macOS code signing; replaced it with Node's built-in test runner for RAD-001.
- Next 16 defaulted `next build` to Turbopack, which requires native SWC bindings unavailable in this environment; set `dev` and `build` scripts to use webpack.
- TypeScript 6 flagged `baseUrl` deprecation; added the explicit `ignoreDeprecations` setting.

### Manual QA

- Happy path: `GET /` returned `200 OK` and rendered the Radar placeholder with the locked assertion-led product copy.
- Sad path: `GET /not-a-real-route` returned `404 Not Found` and rendered the Radar not-found state.
- Screenshot captured from production mode at `test-results/rad-001-home-production.png`.
- Primary navigation/pages did not change unexpectedly because RAD-001 intentionally introduces no product route structure.

### PR-ready summary

- Changed files: app/config/test foundation files, README, RAD-001 ticket, and task board status.
- Tests: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, and `pnpm build` all pass.
- Screenshot: `test-results/rad-001-home-production.png` captured from `next start` on port 3001.
- Risks: Next still logs a local warning that native SWC cannot load under this macOS/Codex code-signing context, then falls back to WASM and completes successfully. The commands are webpack-backed to avoid Turbopack's native-binding requirement.

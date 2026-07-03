# RAD-004 — Create typed environment and secrets validation

## Status

Done

## Priority

P0

## Phase

Phase 0 — Foundation (MVP)

## Objective

Implement typed environment loading and validation so missing Supabase, OpenAI, Trigger.dev, PostHog, Sentry, Resend, and Stripe values fail safely in the correct environments.

## Target outcome

Invalid or missing required environment variables produce clear startup/build errors without exposing secrets.

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

RAD-003 should be complete or deliberately skipped with notes.

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
- [x] The UI/API handles success, loading, empty, and error states where relevant. This ticket adds startup/build validation, not a user-facing UI flow.
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

Implemented typed environment and secrets validation:

- Added `src/lib/env/schema.ts` with typed Radar environment resolution, public/server env key sets, strict-environment requirements, URL validation, and variable-name-only error formatting.
- Added `src/lib/env/server.ts` as the server-side env loading entrypoint for future server modules.
- Added `scripts/validate-env.mjs` and `pnpm validate:env`.
- Wired `pnpm validate:env` into `pnpm dev` and `pnpm build` so startup/build fail before app work in strict environments.
- Kept local/test permissive so early foundation work can build with empty placeholders.
- Strict environments are `preview`, `staging`, and `production`, resolved from `RADAR_ENV`, `NEXT_PUBLIC_RADAR_ENV`, or Vercel env where available.
- Updated `.env.example` with `RADAR_ENV`, `NEXT_PUBLIC_RADAR_ENV`, PostHog host, Sentry DSN, and Stripe publishable key placeholders.
- Documented local vs strict env validation behavior in `README.md`.
- Added `tests/unit/env-validation.test.mjs` to cover local pass, strict missing failure, complete production pass, invalid URL failure, and no secret value leakage.

Commands run:

- `pnpm validate:env` — passed for local.
- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm test` — passed, 11 unit tests.
- `pnpm test:e2e` — passed, 3 smoke tests.
- `pnpm build` — passed. Next still logs the known local SWC native-loader warning and falls back to WASM; Tailwind still runs through WASI.
- `env -i PATH="..." RADAR_ENV=production node scripts/validate-env.mjs` — failed as expected with missing variable names only.

Follow-ups:

- Future service integration tickets should import `src/lib/env/server.ts` from server-only code paths and avoid reading `process.env` directly in UI components.

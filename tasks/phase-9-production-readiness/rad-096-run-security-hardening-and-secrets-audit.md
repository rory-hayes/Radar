# RAD-096 — Run security hardening and secrets audit

## Status

Done

## Priority

P0

## Phase

Phase 9 — Production Readiness (Production)

## Objective

Review auth, RLS, server-only secrets, webhook validation, upload scanning, CSP/headers, dependency audit, and sensitive logging.

## Target outcome

No known high-risk security issues remain before production launch.

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

RAD-095 should be complete or deliberately skipped with notes.

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

- Added global Next.js security headers in `next.config.ts`, including report-only CSP, frame protections, MIME sniffing protection, referrer policy, and restricted browser permissions.
- Hardened local Supabase auth defaults with longer passwords, character requirements, secure password-change checks, slower OTP resend frequency, longer OTPs, and shorter OTP expiry.
- Added upload safety scanning before TXT, Markdown, and PDF extraction to reject executable signatures, executable/script extensions, and non-PDF HTML/script payloads.
- Hardened Stripe webhook parsing so signed but malformed payloads return a controlled 400 response instead of throwing through JSON parsing.
- Removed the PostCSS audit finding by applying a pnpm workspace override to `postcss@8.5.16` and refreshing `pnpm-lock.yaml`.
- Documented security hardening coverage and sensitive logging rules in `docs/SECURITY.md`.
- Added `tests/unit/security-hardening-audit.test.mjs` to cover headers, auth defaults, unsafe uploads, malformed Stripe payload parsing, docs coverage, and runtime sensitive logging checks.

## Validation

- `pnpm lint` passes.
- `pnpm typecheck` passes.
- `pnpm test` passes: 365 unit tests.
- `pnpm build` passes.
- `pnpm test:e2e` passes: 34 e2e tests.
- `pnpm audit --audit-level high` passes with no known vulnerabilities after the PostCSS override.
- `pnpm db:harness:apply` remains blocked because Docker is not running locally: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`.

## Manual QA

- Happy path: production build generated all app and API routes with the new global headers configuration.
- Sad paths: unit coverage verifies unsafe upload payload rejection and malformed signed Stripe payload rejection.
- Navigation: e2e scope-lock tests verify no unrelated primary navigation or product routes changed.
- Screenshots: not applicable; this ticket has no user-facing UI changes.

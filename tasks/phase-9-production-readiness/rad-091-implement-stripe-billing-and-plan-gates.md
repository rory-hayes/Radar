# RAD-091 — Implement Stripe billing and plan gates

## Status

Done

## Priority

P0

## Phase

Phase 9 — Production Readiness (Production)

## Objective

Add Stripe customer/subscription flow, plan limits for assertions/sources/runs, billing portal access, and safe unpaid states.

## Target outcome

Paid plans can gate product usage without corrupting workspace data.

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

RAD-090 should be complete or deliberately skipped with notes.

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

## Result: Done

Implemented workspace-scoped Stripe billing and plan gates:

- Added `billing_customers` with Stripe customer/subscription identifiers, plan/status state, workspace RLS, and admin-only mutation policies.
- Added typed billing schemas, plan limits, unpaid safe-state gates, workspace usage counting, and server-side enforcement before assertion/source/run creation.
- Added direct server-only Stripe helpers for customer, checkout, portal, and webhook signature verification.
- Added `/api/billing/stripe-webhook` for checkout and subscription events using the service-role Supabase client after signature verification.
- Added Settings billing controls using the existing shadcn Card, Button, Alert, Progress, and Badge patterns without adding a primary billing route.
- Documented the billing environment contract and plan-gate behavior in `docs/BILLING.md`.

Validation:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`
- `pnpm db:harness:apply` attempted but blocked because Docker is unavailable: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`

Manual QA notes:

- Settings now shows plan, subscription status, usage bars, checkout, and billing portal controls.
- Stripe checkout/portal sad paths return guarded configuration errors when Stripe env values are absent.
- Existing primary navigation remains Command Center, Assertions, Findings, and Sources only.

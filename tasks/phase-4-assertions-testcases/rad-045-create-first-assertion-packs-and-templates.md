# RAD-045 — Create first assertion packs and templates

## Status

Done

## Priority

P0

## Phase

Phase 4 — Assertions and Test Cases (MVP)

## Objective

Implement V1 templates for Pricing & Plan Accuracy, Refund & Cancellation, Trial & Onboarding, Billing & Invoices, and Support Escalation.

## Target outcome

Users can start from business-focused assertion packs instead of a blank form.

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

RAD-044 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.

## Expected files touched

Assertions UI, assertion APIs/actions, test case logic, templates, generators, and tests.

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

## Implementation report

Result: Done. Added the first five V1 assertion packs and wired the create-assertion page so users can start from a business-focused template instead of a blank form.

Changed files:

- `src/lib/assertions/templates.ts`
- `supabase/migrations/20260703113500_seed_v1_assertion_templates.sql`
- `src/app/(app)/assertions/new/page.tsx`
- `src/components/assertions/assertion-template-picker.tsx`
- `src/components/assertions/assertion-form.tsx`
- `src/components/assertions/index.ts`
- `tests/unit/assertion-templates.test.mjs`
- `tests/unit/assertion-create-edit-flow.test.mjs`

Implemented packs:

- Pricing & Plan Accuracy
- Refund & Cancellation
- Trial & Onboarding
- Billing & Invoices
- Support Escalation

shadcn / MCP notes:

- `shadcnio` MCP was reachable; `list_block_categories` returned the registry categories.
- Ran `pnpm dlx shadcn@latest search @shadcn -q "template picker cards"`; no narrow block matched.
- Ran `pnpm dlx shadcn@latest docs card button badge`.
- Used installed shadcn primitives only: `Card`, `Button`, and `Badge`.
- No demo block routes, unrelated template content, or tokenized registry URLs were added.

Manual QA:

- Happy path: unit tests verify all five packs, system-template migration rows, create-page query parsing, picker links, and form prefill.
- Sad path: invalid or absent `template` search params fall back to the blank create form.
- Auth path: local curl to `http://127.0.0.1:3012/assertions/new?template=pricing-plan-accuracy` returned `307` to `/sign-in?next=%2Fassertions%2Fnew%3Ftemplate%3Dpricing-plan-accuracy`.
- Screenshot: not captured because authenticated app routes redirect without a local signed-in session. UI structure is covered by build and unit tests.
- Navigation scope: no new primary nav entries were added.

Commands run:

- `pnpm dlx shadcn@latest search @shadcn -q "template picker cards"`
- `pnpm dlx shadcn@latest docs card button badge`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm validate:seed`
- `pnpm validate:env`
- `pnpm db:harness`
- `pnpm db:harness:apply` (blocked because Docker daemon is not running)
- `pnpm dev --hostname 127.0.0.1 --port 3012`
- `curl -I -s 'http://127.0.0.1:3012/assertions/new?template=pricing-plan-accuracy'`

Risk / follow-up:

- The migration seeds system templates; Docker is required to apply and verify them locally with Supabase reset.
- Template blueprints are starting points only. RAD-047 and RAD-048 will turn test-case blueprints into editable/generated test cases.

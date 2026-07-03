# RAD-008 — Implement enterprise design tokens and base components

## Status

Done

## Priority

P0

## Phase

Phase 0 — Foundation (MVP)

## Objective

Define Radar's serious enterprise visual system: neutral palette, typography scale, spacing, cards, tables, badges, empty states, buttons, alerts, and status chips.

## Target outcome

The UI foundation looks professional and avoids the earlier childish colour treatment.

## Context

Radar is a customer-facing business verification product. This task must preserve the locked model: assertions define what should be verified, sources/runners are connected only when needed, and findings must be evidence-backed and business-readable.

## Scope


- Define Radar's enterprise visual system using restrained slate/navy/white tokens.
- Create Radar-owned base components using shadcn primitives.
- Build reusable status/severity badges, metric cards, empty/loading/error states, and evidence/display primitives.
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

RAD-007 should be complete or deliberately skipped with notes.

## Implementation notes

- Read `AGENTS.md`, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, and `/docs/PRODUCT_SCOPE.md` before starting.
- Follow existing code conventions if the repository already has working code.
- Prefer small, typed, testable modules over large opaque files.
- Use server-side validation for all mutations.
- Keep workspace scoping explicit in repositories/actions.
- This task contributes to the next E2E gate.
- Avoid colourful template defaults. Use muted semantic status colours and typography hierarchy from `docs/UX_SYSTEM.md`.
- Add minimal visual regression/manual screenshot notes for key components.

## Expected files touched

package/config/app shell/docs/test files as required by the task.

## Acceptance criteria

- [x] The implemented behavior matches the objective and outcome.
- [x] The implementation fits Radar's assertion-led model.
- [x] The UI/API handles success, loading, empty, and error states where relevant.
- [x] Data persists correctly where applicable.
- [x] Workspace authorization is enforced where applicable.
- [x] No unrelated scope is introduced.
- [x] Base components use Radar-owned names and styling.
- [x] The design system avoids playful/consumer styling.
- [x] Components have typed props and basic tests/stories/examples where appropriate.

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

## Codex implementation notes

- Added enterprise Radar CSS tokens for surfaces, borders, status tones, severity tones, subtle shadows, density, and shape in `src/app/globals.css`.
- Added typed Radar-owned base components in `src/components/radar`: `MetricCard`, `StatusBadge`, `SeverityBadge`, `EmptyState`, `LoadingState`, `ErrorState`, and `EvidenceSnippet`.
- Rewired shell placeholders, page header, top bar, sidebar environment state, route loading, and route error handling to use Radar-owned base components.
- Updated `docs/UX_SYSTEM.md` with implemented token families and the RAD-008 component layer.
- Added `tests/unit/design-system.test.mjs` for token coverage, component exports, semantic status/severity variants, and app-shell usage.
- Used installed shadcn primitives only; no new block or template was installed.
- Screenshot QA:
  - Desktop Command Center: `/tmp/radar-rad-008-command-center-desktop.png`
  - Mobile Findings: `/tmp/radar-rad-008-findings-mobile.png`
- Browser QA against `next start` on port 3011 had no console errors.

Commands run:

```bash
pnpm dlx shadcn@latest docs card alert skeleton
pnpm validate:env
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
next start --port 3011
```

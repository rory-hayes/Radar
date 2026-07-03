# UI Blocks Implementation Plan

## Objective

Use shadcn/ui and shadcn.io MCP blocks to accelerate UI implementation without letting a template control the product.

## Core app shell

Build a Radar-owned app shell using shadcn primitives and a dashboard/sidebar block as scaffolding.

Required shell elements:

- left sidebar with Radar wordmark,
- primary nav: Command Center, Assertions, Findings, Sources,
- top bar with workspace switcher, global search placeholder, status/actions, user menu,
- responsive content container,
- consistent page header component,
- route-level loading and error states.

## Command Center

Use card/table/list primitives. The page must show:

- checks run,
- exceptions,
- recommended fixes,
- critical customer-facing issues,
- Needs Attention list,
- assertion health by category,
- recent activity.

Do not add broad analytics charts unless a ticket explicitly requires them.

## Assertions

Use table/data-list primitives. The page must show:

- assertion name,
- category,
- status,
- runner type,
- priority,
- owner,
- schedule,
- pass rate,
- last run,
- source count.

The create/edit flow should use shadcn form primitives and must keep assertions business-readable.

## Assertion detail

Use tabs/cards/detail panels. The page must show:

- assertion purpose,
- expected behavior,
- linked sources,
- test cases,
- latest result,
- evidence used,
- run history,
- suggested fix / linked findings.

## Findings

Use split-pane/inbox/detail primitives. The page must show:

- prioritized finding inbox,
- selected finding detail,
- expected vs actual,
- evidence diff,
- customer impact,
- confidence,
- recommended fix,
- lifecycle actions.

Findings are issues to resolve, not logs to inspect.

## Sources

Use card grid/list primitives. The page must show:

- connected sources,
- source type,
- sync status,
- last sync,
- affected assertions,
- source health,
- source detail.

The Sources page must not become an integration marketplace.

## Design constraints

- Use Radar-owned component names.
- Keep blocks as implementation references, not product architecture.
- Remove demo files immediately after extracting useful patterns.
- Use muted semantic status colours only.
- Screenshots must look enterprise/professional, not playful.

## Done condition for UI tasks

A UI task is not done until:

- the screen matches the active ticket,
- demo content is removed,
- navigation remains locked,
- empty/loading/error states exist,
- visual style matches `docs/UX_SYSTEM.md`,
- build/typecheck/lint pass,
- manual QA screenshots are captured or described in the PR.

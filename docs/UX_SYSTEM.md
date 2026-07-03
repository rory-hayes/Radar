# UX System

Radar should feel like a serious enterprise operations product.

## Design direction

- Neutral palette.
- Charcoal, slate, white, soft gray, subtle navy accents.
- Muted status colors only where necessary.
- Strong typography hierarchy.
- Tables and cards should be dense but readable.
- Avoid playful gradients, childish icons, excessive color, or dashboard noise.

## Core pages

1. Command Center — daily summary and exceptions.
2. Assertions — business truths being monitored.
3. Findings — evidence-backed issues and fix workflow.
4. Sources — evidence inputs needed by active assertions.

## Command Center copy model

The dashboard should use language like:

- 281 checks ran overnight.
- 4 exceptions found.
- 2 recommended fixes.
- 1 critical customer-facing issue.

## UX principle

The user should understand what broke and what to do next without understanding eval infrastructure.


## Shadcn implementation guidance

Use shadcn/ui primitives and selected blocks to speed development, but own the final design system.

Radar UI must use:

- neutral enterprise palette: white, zinc/slate gray, charcoal, navy,
- muted semantic colours only for status/severity,
- compact cards and tables,
- strong typography hierarchy,
- no playful gradients or colourful dashboard chrome,
- no consumer SaaS illustration style,
- no template bloat.

Core Radar-owned components should include:

- `AppShell`
- `SidebarNav`
- `TopBar`
- `PageHeader`
- `MetricCard`
- `StatusBadge`
- `SeverityBadge`
- `AssertionTable`
- `FindingInbox`
- `FindingDetailPanel`
- `SourceCard`
- `EvidenceDiff`
- `RunHistoryMiniChart`
- `EmptyState`
- `LoadingState`
- `ErrorState`

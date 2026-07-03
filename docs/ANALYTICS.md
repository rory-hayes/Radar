# Product Analytics

RAD-089 adds a bounded product analytics taxonomy for measuring Radar usage without collecting sensitive source content.

## Provider

Radar sends server-side capture events to PostHog when `NEXT_PUBLIC_POSTHOG_KEY` is configured. `NEXT_PUBLIC_POSTHOG_HOST` is optional and defaults to `https://app.posthog.com`.

If PostHog is not configured, analytics calls skip safely and must not block product workflows.

## Event Taxonomy

- `source_added` — emitted after a workspace source is created.
- `assertion_approved` — emitted when an assertion is saved as active.
- `run_completed` — emitted after an evaluation run reaches a terminal completed/error state through orchestration.
- `finding_opened` — emitted when a user explicitly opens a finding detail view.
- `fix_rerun` — emitted when a finding validation rerun is queued.
- `report_viewed` — emitted when a user views the weekly trust report.

## Data Boundaries

Analytics properties are allowlisted in `src/lib/analytics/events.ts`.

Allowed properties are IDs, enums, counts, scores, confidence values, period timestamps, and workspace/user identifiers. Do not send source text, evidence excerpts, prompts, expected or actual answer bodies, raw URLs, credentials, webhook URLs, tokens, or private customer documents.

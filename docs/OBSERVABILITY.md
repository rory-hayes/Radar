# Observability

Radar uses Sentry for production error monitoring and release-aware stack traces.

## Sentry setup

Required in strict environments:

- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`

Recommended for source-map upload and release tracking:

- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_RELEASE`

When `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are present during `next build`, `withSentryConfig` uploads production source maps. Client source maps are deleted after upload.

## Privacy boundary

Sentry must not receive source content, evidence chunks, prompts, completions, API keys, auth headers, cookies, or raw request bodies. `src/lib/observability/sentry.ts` applies shared `beforeSend` and `beforeBreadcrumb` filters across client, server, and edge runtimes.

`sendDefaultPii` is disabled. User-level context should stay limited to stable internal ids when needed for debugging.

## Runtime coverage

- `src/instrumentation-client.ts` initializes browser error monitoring and route transition instrumentation.
- `src/instrumentation.ts` registers server and edge SDK config and exports `onRequestError`.
- `src/app/global-error.tsx` captures App Router render failures.
- `src/lib/server/guardrails.ts` captures unexpected server action and API failures before returning generic user-safe errors.
- `next.config.ts` sets Sentry release/source-map build options and routes client events through `/monitoring`.

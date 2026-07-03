# Observability

Radar uses Sentry for production error monitoring and release-aware stack traces, and Langfuse for internal LLM generation traces.

## Sentry setup

Required to enable Sentry events:

- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`

Recommended for source-map upload and release tracking:

- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_RELEASE`

Sentry variables are optional for application boot so production deploys do not need fake observability credentials. When `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are present during `next build`, `withSentryConfig` uploads production source maps. Client source maps are deleted after upload.

## Privacy boundary

Sentry must not receive source content, evidence chunks, prompts, completions, API keys, auth headers, cookies, or raw request bodies. `src/lib/observability/sentry.ts` applies shared `beforeSend` and `beforeBreadcrumb` filters across client, server, and edge runtimes.

`sendDefaultPii` is disabled. User-level context should stay limited to stable internal ids when needed for debugging.

## Runtime coverage

- `src/instrumentation-client.ts` initializes browser error monitoring and route transition instrumentation.
- `src/instrumentation.ts` registers server and edge SDK config, starts Langfuse tracing in the Node runtime when credentials exist, and exports `onRequestError`.
- `src/app/global-error.tsx` captures App Router render failures.
- `src/lib/server/guardrails.ts` captures unexpected server action and API failures before returning generic user-safe errors.
- `next.config.ts` sets Sentry release/source-map build options and routes client events through `/monitoring`.

## Langfuse setup

Optional in all environments:

- `LANGFUSE_PUBLIC_KEY`
- `LANGFUSE_SECRET_KEY`
- `LANGFUSE_BASE_URL`

When both Langfuse keys are present, `src/lib/observability/langfuse-otel.ts` registers a Node OpenTelemetry tracer provider with a `LangfuseSpanProcessor`. Only spans named `radar.llm.*` are exported.

`src/lib/llm/openai-responses.ts` wraps the shared OpenAI Responses JSON provider with `traceRadarLlmGeneration`, so assertion suggestions, test case suggestions, and LLM judging inherit the same trace contract. Recommended-fix prompt contracts remain versioned and trace-ready; the current finding fix generator remains deterministic and does not call an LLM.

## LLM trace privacy

Langfuse must not receive raw prompts, source content, evidence chunks, runner outputs, completions, credentials, cookies, or request bodies. LLM generation observations record:

- provider and model
- prompt id, prompt version, task, and response format
- input and output fingerprints
- latency in milliseconds
- token usage details for Langfuse model/cost inference
- trace and observation ids in provider metadata

Raw prompt inputs and parsed outputs are hashed before they are attached to trace metadata. `src/lib/observability/langfuse-otel.ts` also masks sensitive span fields before export.

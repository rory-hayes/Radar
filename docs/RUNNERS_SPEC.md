# Runners Specification

Radar has exactly three runner types for V1.

## Knowledge Runner

The Knowledge Runner verifies that answers and content match source truth.

Examples:

- AI support answer matches refund policy.
- Help center article matches pricing page.
- Security answer cites current policy.
- Bot refuses out-of-scope questions.

RAD-055 implements the first Knowledge Runner execution loop. It runs approved customer-question test cases against one ready assertion-linked target, captures the actual answer, attaches source evidence references, and persists `test_case_results`.

RAD-057 applies the hybrid evaluator before result persistence so each Knowledge Runner result records status, score, confidence, summaries, evidence refs, and bounded execution metadata. RAD-059 adds manual rerun metadata so users can rerun the whole assertion or only one failed approved customer-question test case after fixing a source or answer target.

## Journey Runner

The Journey Runner verifies customer-facing flows using browser automation.

Examples:

- Trial signup works.
- Welcome email arrives.
- Checkout completes.
- Cancellation page is reachable.
- Onboarding docs match visible product steps.

RAD-062 adds the Playwright Journey Runner foundation in `src/lib/evaluation/journey-runner.ts`.
Journey checks run in isolated headless Chromium browser contexts with no persisted storage state, bounded action/navigation/overall timeouts, screenshot capture, and Playwright trace capture. Screenshots are uploaded as private `screenshot` evidence artifacts, and trace zips are uploaded as private `run-artifact` evidence artifacts under the evaluation run id.

Credential values are accepted only at execution time and must be redacted before entering artifact metadata, execution metadata, summaries, or errors. The foundation exposes redaction helpers, but concrete Journey steps are intentionally deferred to later Phase 6 tasks.

RAD-063 defines a declarative journey step schema in `src/lib/evaluation/journey-schema.ts`.
The schema supports URL visits, clicks, text entry, assertions, waits, email checks, screenshots, and success conditions. Text entry values are either bounded literals or credential references, so sensitive credentials can be supplied at execution time without being stored in reusable journey definitions.

Journey definitions are plain data with unique step ids, bounded step counts, bounded selectors, and optional success conditions. They are designed for human review and runner execution only; they are not a visual workflow canvas.

RAD-064 adds the first Journey pack for Trial & Onboarding in `src/lib/evaluation/journey-packs.ts`.
The pack creates a RAD-063 journey definition from a configurable signup URL, credential names, submit button label, and expected success states. It visits the signup URL, fills email and password fields via credential references, submits the trial form, waits for the onboarding destination, captures a screenshot, and records success conditions.

The pack is declarative and workspace-configured. It does not store test credential values, hardcode a customer URL, or create custom code per workspace.

RAD-065 adds a server-only email receipt verification utility in `src/lib/evaluation/email-receipts.ts`.
The utility normalizes test mailbox and webhook receipt payloads, matches expected recipient, subject, body, receipt window, and source kind, then returns runner-ready actual output plus redacted `email_receipt` evidence artifacts. Receipt evidence stores hashes, timestamps, match booleans, and redacted previews instead of raw email bodies, bearer tokens, magic links, or full recipient addresses.

## Integration Runner

The Integration Runner verifies downstream handoffs using API/webhook evidence.

Examples:

- Support ticket was created.
- Webhook fired.
- Email was sent.
- Billing state changed.
- CRM task was created.

RAD-066 adds the server-only Integration Runner foundation in `src/lib/evaluation/integration-runner.ts`.
The runner executes approved `integration_check` test cases as bounded HTTP requests, supports configured GET/POST/PUT/PATCH/DELETE methods, validates response status and optional response text, injects bearer or API-key auth headers only from execution-time credentials, and persists per-test-case results through the shared evaluation repository path.

Integration evidence is captured as redacted `http_exchange` artifacts and runner metadata. Request URLs are reduced to safe previews, sensitive headers are masked, response bodies are hashed and bounded, and credential values are redacted before entering actual output, metadata, summaries, or errors.

RAD-067 adds generic Integration check definitions in `src/lib/evaluation/integration-checks.ts`.
The supported checks are `webhook_fired`, `api_expected_state`, `ticket_endpoint_accepted`, and `billing_object_updated`. Each definition compiles to the RAD-066 `integration_check` input shape, so generic API and webhook assertions reuse the same bounded HTTP execution, response validation, credential handling, and redacted evidence capture.

RAD-068 adds minimal handoff templates in `src/lib/evaluation/handoff-templates.ts`.
The templates cover `email-sent`, `support-ticket-created`, `crm-task-created`, `webhook-event-received`, and `billing-status-changed`. They only collect the endpoint, optional auth/header configuration, expected status, optional text matcher, and optional JSON state matcher needed by the assertion; each template compiles to a RAD-067 generic check and then to the RAD-066 Integration Runner input.

## Shared runner contract

RAD-061 defines the shared runner contract in `src/lib/evaluation/runner-contract.ts`.
Knowledge, Journey, and Integration runners must all return the same top-level contract so assertion, run, result, and findings models do not fork by runner type.

Each runner receives:

- workspace id
- assertion
- evaluation run job
- trigger type
- runner type
- attempt and max-attempt retry context
- one or more runner-specific test case inputs

Each runner returns:

- terminal status
- per-test status counts
- score and confidence where available
- bounded actual output
- actual and evaluator summaries
- evidence references
- evidence artifacts
- error details if any
- started/completed timestamps and duration
- retry metadata
- redacted execution metadata

Evidence artifacts are typed as source evidence, screenshots, traces, HTTP exchanges, email receipts, webhook events, or redacted logs. They must reference private artifact storage or workspace-scoped source records; runner credentials, bearer tokens, raw webhook secrets, and unredacted PII must not be stored in artifacts or metadata.

Retry semantics are owned by the evaluation job orchestrator. Runners expose attempt, max attempts, and retryability in `runnerContract` metadata, while the orchestrator decides whether to reschedule a failed job.

## Constraint

Do not add new runner types until the three-runner model is production-stable.

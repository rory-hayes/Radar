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

## Integration Runner

The Integration Runner verifies downstream handoffs using API/webhook evidence.

Examples:

- Support ticket was created.
- Webhook fired.
- Email was sent.
- Billing state changed.
- CRM task was created.

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

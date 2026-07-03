# Runners Specification

Radar has exactly three runner types for V1.

## Knowledge Runner

The Knowledge Runner verifies that answers and content match source truth.

Examples:

- AI support answer matches refund policy.
- Help center article matches pricing page.
- Security answer cites current policy.
- Bot refuses out-of-scope questions.

RAD-055 implements the first Knowledge Runner execution loop. It runs approved customer-question test cases against one ready assertion-linked target, captures the actual answer, attaches source evidence references, and persists raw `test_case_results`. These raw outputs are not final scoring decisions; the evaluator rubric decides pass, warning, fail, or finding creation in later Phase 5 work.

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

Each runner returns:

- status
- actual result
- expected result
- evidence artifacts
- error details if any
- duration
- retry metadata
- confidence hints
- redacted logs

## Constraint

Do not add new runner types until the three-runner model is production-stable.

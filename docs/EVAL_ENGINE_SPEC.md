# Evaluation Engine Specification

The Evaluation Engine decides whether a runner result satisfies an assertion.

## Inputs

- Assertion
- Test case
- Runner output
- Evidence chunks and source snapshots
- Rubric version
- Workspace configuration

## Outputs

- Passed, Warning, Failed, Inconclusive, Skipped, or Error
- Score
- Confidence
- Expected summary
- Actual summary
- Evidence references
- Mismatch explanation
- Suggested severity
- Finding creation recommendation

## Evaluation dimensions

- Correctness
- Completeness
- Source grounding
- Citation quality
- Policy consistency
- Refusal behavior
- Escalation behavior
- Freshness
- Journey completion
- Integration side effect completion

## Hybrid scoring

Radar must combine deterministic checks, evidence comparison, contradiction detection, schema assertions, runner outputs, and LLM-as-judge. LLM-as-judge should never be the only signal for critical findings.

## LLM prompt contracts

RAD-052 introduces a server-only LLM adapter for OpenAI Responses JSON calls. Prompt contracts are versioned in code with an id, version, task, instructions, strict JSON schema, and output-token limit. Runtime metadata must record provider, model, prompt id, prompt version, task, response format, input fingerprint, request time, and token usage when available. Do not persist raw prompts, raw source context, API keys, or bearer values in logs or client-visible metadata.

Phase 5 prompt tasks are limited to generation, judging, summarization, and fix recommendations. They must stay assertion-led and evidence-backed; prompt contracts must not introduce a prompt playground, trace explorer, model comparison UI, or generic eval platform surface.

## Evidence loading

RAD-053 adds a server-only evaluation evidence loader that runs before judging. The loader validates workspace assertion and test-case ownership, restricts retrieval to assertion-linked sources, builds a test-case-specific retrieval query, reuses the assertion-scoped evidence retrieval service, converts matches into bounded evaluation evidence references, and attaches latest source-version/document snapshots for explainability.

Evidence loading is not a generic workspace search surface. It exists only to ground a specific assertion/test-case evaluation and must not copy full source documents or raw source context into logs, traces, or client-visible metadata.

## Evidence rule

No evidence means no critical finding. Serious findings must include expected vs actual plus source evidence or runner artifact.

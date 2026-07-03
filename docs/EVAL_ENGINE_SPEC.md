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

RAD-056 implements the hybrid evaluator rubric for Knowledge Runner answers. The rubric scores source grounding, contradiction detection, completeness, refusal behaviour, citation validity, and policy consistency before optionally blending an LLM judge result. Deterministic scoring remains the majority signal, and an evidence-free result stays inconclusive with no recommended finding even if an LLM judge would otherwise escalate it.

## LLM prompt contracts

RAD-052 introduces a server-only LLM adapter for OpenAI Responses JSON calls. Prompt contracts are versioned in code with an id, version, task, instructions, strict JSON schema, and output-token limit. Runtime metadata must record provider, model, prompt id, prompt version, task, response format, input fingerprint, request time, and token usage when available. Do not persist raw prompts, raw source context, API keys, or bearer values in logs or client-visible metadata.

Phase 5 prompt tasks are limited to generation, judging, summarization, and fix recommendations. They must stay assertion-led and evidence-backed; prompt contracts must not introduce a prompt playground, trace explorer, model comparison UI, or generic eval platform surface.

## Evidence loading

RAD-053 adds a server-only evaluation evidence loader that runs before judging. The loader validates workspace assertion and test-case ownership, restricts retrieval to assertion-linked sources, builds a test-case-specific retrieval query, reuses the assertion-scoped evidence retrieval service, converts matches into bounded evaluation evidence references, and attaches latest source-version/document snapshots for explainability.

Evidence loading is not a generic workspace search surface. It exists only to ground a specific assertion/test-case evaluation and must not copy full source documents or raw source context into logs, traces, or client-visible metadata.

## Knowledge target configuration

RAD-054 adds server-only Knowledge target configuration for assertion-linked sources. A Knowledge Runner assertion can use linked support bot endpoints, generic HTTP endpoints, uploaded answer sets, or manual answer sets as customer-facing answer targets. The configuration layer validates the assertion in the active workspace, loads only linked source records, classifies supported target types, and reports readiness before runner execution.

Endpoint targets expose only URL, HTTP method, and credential mode. Credentials, bearer values, and API keys must stay outside target configuration records, UI summaries, logs, and evaluation metadata. Uploaded and manual answer-set targets are runnable only after synced content is available. The assertion detail Sources tab renders this readiness state so users can complete the minimum target setup without leaving Radar's assertion-led model.

## Knowledge Runner raw execution

RAD-055 adds the server-only execution loop for raw Knowledge Runner outputs. It claims queued knowledge runs, loads approved customer-question test cases, selects one ready target from the assertion-linked target configuration, retrieves assertion-scoped evidence, calls the configured endpoint or uploaded/manual answer set, and writes one `test_case_results` row per executed test case.

Raw Knowledge Runner outputs are intentionally marked `inconclusive` until the hybrid evaluator scores them in later tickets. Each result stores bounded actual answer text, target metadata without credentials, evidence references, timing metadata, and bounded error details when target execution fails. The run summary records aggregate raw-output capture state and evidence refs, not final pass/fail scoring.

## Evidence rule

No evidence means no critical finding. Serious findings must include expected vs actual plus source evidence or runner artifact.

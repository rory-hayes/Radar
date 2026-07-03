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

RAD-057 persists per-test scored results by applying the hybrid rubric during Knowledge Runner execution before inserting `test_case_results`. Each result stores status, score, confidence, bounded actual summary, evaluator summary, evidence refs, timing metadata, and rubric dimension metadata. The evaluation run summary aggregates result counts plus average score and confidence so run history can be inspected at assertion and test-case granularity.

RAD-059 upgrades manual reruns from a placeholder trigger into a queued evaluation action. Manual rerun metadata records whether the user reran the whole assertion or one failed test case, the requesting user, and the request time. The server action validates workspace permission and approved runnable test cases before queueing, and the Knowledge Runner filters targeted reruns to the selected approved customer-question test case.

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

RAD-055 adds the server-only execution loop for Knowledge Runner outputs. It claims queued knowledge runs, loads approved customer-question test cases, selects one ready target from the assertion-linked target configuration, retrieves assertion-scoped evidence, calls the configured endpoint or uploaded/manual answer set, and writes one `test_case_results` row per executed test case.

Knowledge Runner outputs are scored by the hybrid evaluator before persistence. Each result stores bounded actual answer text, target metadata without credentials, evidence references, timing metadata, bounded error details when target execution fails, status, score, confidence, and evaluator summary. The run summary records aggregate scored state and evidence refs.

## Evidence rule

No evidence means no critical finding. Serious findings must include expected vs actual plus source evidence or runner artifact.

RAD-071 adds the findings creation engine that turns failed or warning `test_case_results` into evidence-backed findings. The engine validates workspace consistency across the assertion, test case, run, and result; skips non-actionable statuses; derives severity from assertion priority plus result status; stores bounded expected, actual, customer-impact, and recommended-fix text; and links run output plus source/artifact evidence rows.

Repeated failures are deduplicated with a stable key built from workspace, assertion, test case, runner type, result status, and a bounded failure fingerprint. Active duplicates update `last_seen_at`, latest run/result links, summary, actual output, severity, confidence, evidence, and activity instead of creating a new issue. Resolved, ignored, or false-positive findings are not silently reopened by the creation path.

RAD-075 adds a severity and customer impact model for findings. Severity is based on assertion priority, failure type, runner type, affected journey signal, confidence, repeat count, customer-facing terms, and explicit blocker/error signals. Customer impact text explains the business risk in terms of the assertion, test case, runner type, repeat count, and confidence so findings are prioritized by customer-facing risk rather than technical status alone.

RAD-076 adds a deterministic recommended fix generator for findings. It uses only the assertion, test case, result status, bounded runner output, evidence references, runner type, and known assertion owner. The no-hallucination guardrail records whether the recommendation is `evidence_grounded`, `runner_output_only`, or `insufficient_evidence`; insufficient-evidence findings recommend capturing source or artifact evidence before changing customer-facing behavior. The generator does not invent owners, tools, policies, credentials, or integrations, and it does not add a prompt playground or generic eval surface.

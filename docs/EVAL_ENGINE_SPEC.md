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

## Evidence rule

No evidence means no critical finding. Serious findings must include expected vs actual plus source evidence or runner artifact.

# Risk Register

## Risk 1 — Product scope drift

Radar could drift into a generic AI eval platform, workflow builder, or observability product.

Mitigation: enforce AGENTS.md, PRODUCT_SCOPE.md, and ticket-level out-of-scope sections.

## Risk 2 — Integration bloat

The product could become integration-led instead of assertion-led.

Mitigation: only connect sources/runners required by active assertions.

## Risk 3 — LLM false positives

Poor evaluations could create noisy findings and reduce trust.

Mitigation: hybrid evaluator, evidence requirement, confidence scoring, false-positive workflow.

## Risk 4 — Security mistakes

Radar handles sensitive docs, endpoints, and artifacts.

Mitigation: RLS, server-only secrets, encrypted credentials, storage isolation, audit logs, security gates.

## Risk 5 — Codex slop

Large tasks could produce broad, shallow code.

Mitigation: one ticket per PR, acceptance criteria, tests, E2E gates every ten tasks.

## Risk 6 — Overbuilding before sales validation

The team could build production breadth before proving paid demand.

Mitigation: RAD-090 demo-ready milestone should be used for pilot sales before optional expansion.

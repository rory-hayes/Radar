# Product Scope

This file defines what Radar is allowed to become during this build and what must stay out of scope until validated.

## In scope for V1

- Customer-facing business assertions.
- Command Center, Assertions, Findings, Sources.
- Knowledge Runner, Journey Runner, Integration Runner.
- Evidence-backed findings.
- Recommended fixes.
- Source ingestion for URLs, uploaded docs, manual text, and endpoint configuration.
- Basic Playwright journeys.
- Generic API/webhook integration checks.
- Weekly trust report.
- Email/Slack notification basics.
- Production hardening for controlled pilots.

## Out of scope for V1

- Full integration marketplace.
- Full low-code workflow builder.
- Full observability product.
- Prompt playground.
- Trace explorer.
- Model comparison UI.
- Process mining.
- CRM-wide automation.
- Enterprise SSO unless required by pilot contract.
- Multiple complex custom connectors before paid demand.

## Scope rule

If a feature does not help a user create, run, understand, fix, or monitor a customer-facing assertion, it does not belong in V1.

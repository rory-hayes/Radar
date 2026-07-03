# Radar PRD

## Product summary

Radar continuously tests that your customer-facing business still works.

Radar is a customer-facing business verification platform. It continuously verifies whether a company's customer-facing promises are still true across AI agents, docs, workflows, customer journeys, automations, and integrations.

## Tagline

Catch broken customer-facing promises before your customers do.

## Product category

Managed evals for customer-facing business systems.

## Locked positioning

Radar should be described externally as customer-facing business verification. Internally, it uses evals, runners, evidence collection, assertion management, and findings workflows. It should not be positioned as a generic AI eval platform.

## Core user question

> What customer-facing promises are broken today, why do they matter, and what should we fix?

## Primary ICP

B2B SaaS and software-enabled companies with customer-facing docs, pricing pages, AI support, onboarding flows, billing/refund flows, support workflows, and integrations that can drift over time.

## Primary personas

- Head of Support / CX
- Product Operations
- Founder / COO
- AI implementation lead
- Engineering lead for customer-facing systems

## Core object: Assertion

An assertion is a business truth Radar continuously verifies.

Examples:

- Pricing answers and checkout limits match the current pricing page.
- Refund policy answers match the current refund policy.
- Trial users can sign up and receive the welcome email.
- Cancellation requests create the correct support/billing handoff.
- AI support escalates account-risk and billing issues to a human.

## Core pages

1. Command Center — the daily operational summary.
2. Assertions — the business truths being monitored.
3. Findings — exceptions, evidence, impact, and fixes.
4. Sources — the evidence and systems needed by active assertions.

## Core runners

1. Knowledge Runner — verifies docs, policies, AI answers, help center, pricing, and knowledge consistency.
2. Journey Runner — verifies customer journeys such as signup, onboarding, checkout, cancellation, and email receipt.
3. Integration Runner — verifies handoffs such as email sent, ticket created, webhook fired, CRM task created, or billing state updated.

## MVP promise

A workspace can define assertions, connect only the sources/runners required for those assertions, run checks, and receive evidence-backed findings with recommended fixes.

## Non-goals

- Generic AI eval dashboard.
- LLM trace explorer.
- Prompt playground.
- Agent builder.
- Workflow automation builder.
- Visual workflow canvas.
- Process mining platform.
- Integration marketplace.
- Full business digital twin.
- Chrome extension as the core MVP.

## Success criteria

- Time to first meaningful assertion under 15 minutes.
- First evidence-backed finding visible from demo data or a real source.
- Every finding includes expected vs actual, evidence, confidence, impact, and recommended fix.
- Dashboard can summarize: checks run, exceptions, recommended fixes, and critical issues.
- The product remains assertion-led and avoids integration-led onboarding.

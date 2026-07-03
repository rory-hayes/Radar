# Product and Architecture Decisions

This file records locked decisions so Codex does not drift.

## Decision 1 — Build Radar, not generic AI evals

Radar is a customer-facing business verification product. AI evals are an internal capability, not the product category.

## Decision 2 — Assertion-led, not integration-led

Users define what should be verified. Radar connects only the sources/runners required for that assertion.

## Decision 3 — Four pages only for V1

Command Center, Assertions, Findings, and Sources are the only primary pages.

## Decision 4 — Three runner types only for V1

Knowledge Runner, Journey Runner, and Integration Runner are enough.

## Decision 5 — No bloat

No trace explorer, prompt playground, agent builder, workflow canvas, or integration marketplace in V1.

## Decision 6 — Managed services first

Use Vercel, Supabase, Trigger.dev, OpenAI, Playwright, Sentry, Langfuse, PostHog, Resend, and Stripe to move quickly.

# Radar Architecture

## Overview

Radar is built around an assertion-led architecture: users define what should be verified, Radar collects only the necessary evidence, runs the appropriate runner, evaluates actual versus expected, and creates evidence-backed findings.

## Architecture layers

1. Web App — Next.js application shell and UI.
2. Auth and Workspace Layer — Supabase Auth, workspace membership, RBAC, and RLS.
3. Assertion Engine — assertion configuration, schedules, templates, and test cases.
4. Evidence Collector — source ingestion, content extraction, chunking, embeddings, snapshots, and retrieval.
5. Runners — Knowledge Runner, Journey Runner, Integration Runner.
6. Evaluation Engine — scoring, rubrics, evidence comparison, LLM judging, contradiction detection.
7. Findings Engine — deduplication, severity, confidence, recommended fixes, lifecycle.
8. Outputs — Command Center, reports, email/Slack alerts, future Jira/Linear tasks.
9. Observability — Sentry, Langfuse, product analytics, audit logs.

## Assertion-led flow

1. User creates or approves an assertion.
2. Radar identifies required sources and runner type.
3. Evidence Collector retrieves and snapshots source evidence.
4. Runner executes the check.
5. Evaluation Engine compares actual output to expected behavior and evidence.
6. Findings Engine creates or updates findings if needed.
7. Command Center and alerts summarize exceptions and recommended fixes.

## Key architectural constraint

Radar must not connect every system up front. Each assertion declares the minimum sources and runner credentials needed to verify that specific business truth.

## Server guardrails

RAD-017 adds a server-only guardrail layer for backend entrypoints. Server actions and JSON route handlers use standardized action and JSON API response envelopes, Zod-backed input validation, authenticated-user resolution, workspace membership resolution, and permission checks before repositories or Supabase writes run. Product tables remain assertion-led and workspace-owned; guardrails prevent future source, assertion, run, and finding mutations from trusting client-provided workspace context.

## Repository layer

RAD-025 adds server-only typed repositories under `src/lib/repositories`. Product routes, server actions, route handlers, and runner code should use these modules instead of scattering raw Supabase table queries through UI or workflow files. Repositories accept a Supabase client, require explicit `workspaceId` for workspace-owned records, parse mutation input with the shared Zod schemas, and map database rows into Radar domain types.

The repository layer is not an authorization substitute. Server actions and APIs must still use the guardrail layer to resolve the authenticated user, active workspace, and permission before calling repositories.

## Bootstrap stack

- Next.js and Vercel for the web app.
- Supabase for auth, Postgres, RLS, storage, and pgvector.
- Trigger.dev for background jobs and scheduled runs.
- OpenAI for assertion/test generation, judging, and fix summaries.
- Playwright for Journey Runner execution.
- Langfuse for internal LLM observability.
- Sentry for application monitoring.
- PostHog for product analytics and feature flags.
- Resend for email.
- Stripe for billing.
- Nango later for OAuth integrations when customer demand proves the need.

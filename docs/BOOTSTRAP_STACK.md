# Bootstrap Stack

This file describes the services and frameworks to use to build Radar quickly without overbuilding infrastructure.

## Frontend

Use Next.js, React, TypeScript, Tailwind, shadcn/ui conventions, React Hook Form, Zod, and lucide icons.

## Hosting

Use Vercel for application hosting, preview deployments, environment variables, and production deploys.

## Backend and data

Use Supabase for Auth, Postgres, Row Level Security, Storage, Edge/runtime helpers where useful, and pgvector for embeddings.

## Jobs

Use Trigger.dev for source sync, indexing, embedding, evaluation runs, reruns, weekly report generation, and notification dispatch.

## AI

Use OpenAI server-side for assertion generation, test case generation, answer judging, contradiction summaries, and recommended fixes.

## Journey Runner

Use Playwright for browser-based customer journey verification and screenshot/trace artifacts.

## Integrations

Start with URLs, uploads, manual text, API endpoints, incoming webhooks, and simple Slack webhook. Add Nango later for OAuth-heavy integrations once customers ask for them.

## Observability

Use Sentry for app errors and Langfuse for internal LLM traces. Use PostHog for product analytics and feature flags.

## Email and billing

Use Resend for transactional email and Stripe Billing for subscriptions once the product reaches paid pilot readiness.

## Principle

Use managed services for everything except Radar's moat: assertions, evidence-backed verification, runner orchestration, findings, and recommended fixes.


## UI acceleration with shadcn MCP

Use shadcn/ui as the component foundation and use shadcn MCP as an implementation accelerator.

Preferred setup:

- `shadcnio` remote HTTP MCP for authenticated shadcn.io block search and install commands.
- official `shadcn` MCP via `npx shadcn@latest mcp` as a fallback for core shadcn/ui components and official blocks.
- no committed tokens; use `SHADCNIO_BEARER` as an environment-provided authorization header.

Approved initial scaffold:

- official `dashboard-01` for the shell/card/table structure,
- sidebar primitives or `sidebar-07` for the app navigation,
- `login-03` only if it improves auth screen implementation.

Codex must use blocks as scaffolding only and must refactor installed code into Radar-owned components.

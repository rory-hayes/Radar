# Radar Codex Build Pack

Catch broken customer-facing promises before your customers do.

This pack contains the repo-native product documentation, architecture notes, task board, detailed tickets, Codex `/goal` kickoff prompt, E2E gates, and production-readiness plan needed to build Radar from MVP to controlled production launch.

## Product lock

Radar is **customer-facing business verification**. It is not a generic AI eval dashboard. It is not a full business digital twin. It is an assertion-led platform that continuously verifies whether customer-facing promises remain true across AI agents, docs, workflows, customer journeys, automations, and integrations.

## How to use this pack

1. Copy these files into the root of the Radar repo.
2. Commit the docs and tasks before implementation starts.
3. Start Codex with `/tasks/KICKOFF_GOAL_PROMPT.md`.
4. Codex should work tickets in order from `/tasks/TASKS.md`.
5. Every tenth task is an E2E quality gate to prevent drift.
6. Do not skip gates unless you deliberately update `/tasks/QUALITY_GATES.md` and explain why.

## Required build discipline

- One task = one focused branch/PR.
- Every PR references one RAD ticket.
- Every task includes acceptance criteria, test criteria, and definition of done.
- Every tenth task forces E2E validation.
- No generic eval platform features unless they serve Radar's assertion-led model.

## Recommended first command

Paste the contents of `/tasks/KICKOFF_GOAL_PROMPT.md` into Codex using `/goal`.

## Local development

RAD-001 adds the baseline Next.js application and quality scripts.

Use pnpm:

```bash
pnpm install
pnpm dev
```

Quality checks:

```bash
pnpm validate:env
pnpm validate:seed
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

The Next build and typecheck paths force Tailwind's WASI path with `NAPI_RS_FORCE_WASI=true` so local Codex runs do not depend on unsigned native Tailwind binaries. Next may still log its SWC native-loader warning locally and fall back to WASM.

## Environment validation

Copy `.env.example` to `.env.local` for local development. `RADAR_ENV=local` allows empty service placeholders while early foundation work is still offline. `RADAR_ENV=preview`, `RADAR_ENV=staging`, `RADAR_ENV=production`, or Vercel preview/production environments require the Supabase, OpenAI, Trigger.dev, PostHog, Sentry, Resend, and Stripe variables before dev/build continues.

Validation errors list variable names only. They do not print secret values.

## CI

GitHub Actions runs the same baseline gates on pull requests and pushes to `main`/`master`: install, env validation, lint, typecheck, unit tests, E2E smoke tests, and build.

The initial app intentionally exposes only a clean Radar placeholder. Product routes for Command Center, Assertions, Findings, and Sources are introduced by later RAD tickets.

## Supabase local development

RAD-006 adds the local Supabase migration and reset pipeline. Use `pnpm supabase:start`, `pnpm supabase:status`, and `pnpm db:reset` after `pnpm install`. The seed entrypoint is intentionally empty until the demo seed tickets add deterministic local data.

See [docs/SUPABASE_LOCAL_DEVELOPMENT.md](docs/SUPABASE_LOCAL_DEVELOPMENT.md) for migration naming, reset/seed behavior, and local env setup.


## Shadcn MCP setup for Codex

This pack includes `.codex/config.toml` with two MCP servers:

- `shadcnio` — authenticated shadcn.io HTTP MCP using the `SHADCNIO_BEARER` environment header.
- `shadcn` — official shadcn/ui MCP via `npx shadcn@latest mcp`.

Before running UI tasks, configure the token outside git:

```bash
export SHADCNIO_TOKEN="paste-your-token-here"
export SHADCNIO_BEARER="Bearer $SHADCNIO_TOKEN"
```

Then restart Codex, trust the project-scoped config if prompted, and run `/mcp` to confirm the server is connected.

Use `tasks/KICKOFF_GOAL_PROMPT_WITH_SHADCN_MCP.md` as the preferred kickoff prompt.

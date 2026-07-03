# Supabase Local Development

Radar uses Supabase for Auth, Postgres, RLS, Storage, and pgvector. This document covers the local migration and reset pipeline only; product schema work starts in later RAD data-model tickets.

## Prerequisites

- Docker Desktop or another Docker engine running locally.
- `pnpm install` completed from the repo root.
- Local environment values copied from `.env.example` into `.env.local`.

## Commands

```bash
pnpm supabase:start
pnpm supabase:status
pnpm db:reset
pnpm supabase:stop
```

`pnpm supabase:start` boots the local Supabase stack. `pnpm supabase:status` prints the local API URL and keys to copy into `.env.local` for local development. Do not commit those values.

Use this local URL value unless `pnpm supabase:status` reports a different port:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
```

Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` from `pnpm supabase:status`. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.

## Auth Smoke Testing

RAD-011 wires Supabase Auth into the Next.js app with `/sign-in`, `/sign-up`, `/auth/callback`, and `/auth/sign-out`.

After local Supabase is running and `.env.local` contains the local URL and keys, start the app:

```bash
pnpm dev
```

Open `/command-center` in a private browser session. You should be redirected to `/sign-in?next=%2Fcommand-center`. Create an account through `/sign-up`; local Supabase captures auth emails in Mailpit, which is listed by `pnpm supabase:status`. After confirmation or local sign-in, Radar redirects back to the intended protected route.

## Migrations

Create a migration with:

```bash
pnpm supabase:migration:new <snake_case_name>
```

Write SQL into the generated file under `supabase/migrations`. For Radar product tables, include workspace ownership and RLS in the same schema change unless the ticket explicitly splits the work. Do not create product tables without a workspace isolation plan.

## Reset and Seed

Reset the local database with:

```bash
pnpm db:reset
```

The reset command applies every migration and then runs `supabase/seed.sql` because `supabase/config.toml` sets `db.seed.enabled = true`.

`supabase/seed.sql` is intentionally a no-op until schema tables exist. RAD-009 defines the demo data policy and seed contract; RAD-019 owns the first representative demo workspace and users. Until then, do not add mock product rows to application paths.

See `docs/DEMO_DATA_POLICY.md` before adding any local/demo seed rows.

## Production Boundary

This local pipeline does not push migrations to a hosted Supabase project. Remote migration rollout belongs with deployment and operations tasks, with backups, environment-specific credentials, and RLS checks in place.

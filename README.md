# Radar V1

Radar is a hidden-until-needed real-time knowledge copilot for complex B2B technical customer conversations.

This repo contains the V1 web app, Knowledge Studio admin shell, server API contracts, AI/RAG guardrails, security checks, and a static Chrome extension overlay shell. The browser never receives a long-lived OpenAI API key; live transcription clients must request short-lived Realtime credentials from the server.

## What Is Included

- Landing/product surface rewritten from the Prodexa baseline for Radar.
- Knowledge Studio routes under `/app` for users, sources, uploads, connectors, playbooks, approvals, testing/replay, knowledge gaps, analytics, sessions, settings, and audit.
- API route contracts under `/api/v1` with `/v1/*` rewrites for the extension.
- OpenAI Realtime client-secret server helper using `POST /v1/realtime/client_secrets`.
- AI/RAG schemas and eval tests that require citations for Answer/Proof cards and route unsupported claims to Needs confirmation or Escalate states.
- Static Manifest V3 Chrome extension in `apps/extension` with offscreen microphone WebRTC transcription.
- Security, dummy-data, secret-boundary, and eval QA scripts.

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

If the shell cannot find Node, use the bundled Codex runtime:

```bash
export PATH="/Users/rory/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/rory/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin:$PATH"
```

## Environment

Required for local UI:

- `NEXT_PUBLIC_APP_URL`

Required before real Realtime transcription:

- `OPENAI_API_KEY` server-side only
- `OPENAI_REALTIME_MODEL`
- `OPENAI_REALTIME_CLIENT_SECRET_TTL_SECONDS`
- `OPENAI_SAFETY_IDENTIFIER` or `RADAR_OPENAI_SAFETY_IDENTIFIER`
- `OPENAI_EMBEDDING_MODEL` for source ingestion, currently expected to be a 1536-dimension embedding model such as `text-embedding-3-small`
- `RADAR_EXTENSION_ORIGIN` set to the Radar Chrome extension origin, currently `chrome-extension://jhjclgndbjlnnagdnphjdojinaaodeon`

Required before production password sign-in:

- `AUTH_SECRET`
- `RADAR_AUTH_PASSWORD`
- `RADAR_AUTH_ALLOWED_EMAILS` when access should be limited to specific emails

Required before workspace data leaves setup mode:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_PUBLISHABLE_KEY`
- `RADAR_DEFAULT_WORKSPACE_ID`
- `RADAR_ADMIN_ROLE` for the bootstrap admin emails listed in `RADAR_AUTH_ALLOWED_EMAILS`

Workspace user management uses Supabase tables plus Supabase Auth email delivery for invites and reset links. Branded invite and recovery templates live in `supabase/templates`; apply them to the hosted Supabase project with:

- `pnpm run auth:email:configure`

That script requires `SUPABASE_ACCESS_TOKEN` plus `SUPABASE_PROJECT_REF` or `SUPABASE_URL`. SMTP values are optional, but should be set before production email volume.

Run migrations before production sessions:

- `pnpm run db:migrate`
- `pnpm run db:seed`

Do not configure `NEXT_PUBLIC_OPENAI_*` variables.

## Knowledge Ingestion And RAG

Admins and knowledge managers can upload text-based source material from `/app/uploads`. The server extracts text, calls OpenAI embeddings with the server-only API key, stores approved source chunks in Supabase `pgvector`, and records ingestion/audit state in Supabase.

Final transcript segments run retrieval against approved workspace chunks. When approved evidence is found, Radar emits a cited Proof card. When retrieval cannot support the segment, Radar emits Needs confirmation instead of an unsupported Answer card.

## Workspace And User Onboarding

Radar is workspace-first. Admins configure the shared workspace, approved knowledge, citation policy, escalation behavior, and invitations. Invited users complete personal onboarding for browser extension setup, permissions, call consent expectations, and card-state training. Users can surface gaps from calls, but production answers remain governed by centrally approved workspace knowledge.

## Chrome Extension

Load the unpacked extension from `apps/extension` in `chrome://extensions`.

The extension popup talks to the app API. Sign in to the Radar web app in the same browser first, then set `RADAR_EXTENSION_ORIGIN` to `chrome-extension://jhjclgndbjlnnagdnphjdojinaaodeon` so the API can allow credentialed requests from the unpacked extension. It collects page context for preflight/session creation and requests short-lived Realtime credentials from the server. It does not embed an OpenAI API key.

## QA

```bash
pnpm run typecheck
pnpm run lint
pnpm run scan:no-dummy-data
pnpm run scan:secrets
pnpm run test
pnpm run qa:security
pnpm run build
```

The production build and QA checks should pass before any deployment. See `PRODUCTION_READINESS_REPORT.md` and `KNOWN_LIMITATIONS.md` before piloting.

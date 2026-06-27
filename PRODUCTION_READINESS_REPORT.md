# Radar V1 Production Readiness Report

## Current Status

Radar V1 is a deployed vertical slice with Supabase-backed workspace, invite, session, transcript, guidance card, feedback, and audit persistence. It is not production-ready until source ingestion/RAG, retention jobs, public access settings, and full browser extension verification are complete.

## Ready

- Next.js app compiles and builds.
- Chrome extension shell can be loaded unpacked and includes a microphone WebRTC transcription path.
- Server-only OpenAI key boundary is implemented.
- Realtime browser credential path uses server-minted client secrets.
- Citation and unsupported-claim rules are encoded in schemas and evals.
- Admin UI avoids seeded production data.
- Supabase migrations exist and have been run for workspace runtime tables.
- Session state is persisted in Supabase rather than process memory.
- Workspace user invites and password reset emails use Supabase Auth delivery.
- Security and QA scripts are present and passing locally.

## Not Ready

- Source ingestion, indexing, embeddings, and document permissions are not implemented end to end.
- Tenant isolation uses server-side Supabase access and app-level membership checks; database RLS is enabled for client access but no client policies are exposed yet.
- Realtime transcription has a server credential path, but full extension capture still needs live browser verification.
- Extension tab-audio capture remains a gated shell; microphone transcription is implemented first.
- Deployment Protection currently blocks public unauthenticated smoke tests.
- Observability, retention/deletion jobs, and incident runbooks are not configured.

## Required Before Pilot

- Connect approved source ingestion, freshness metadata, retrieval indexes, and citation storage.
- Exercise OpenAI Realtime transcription against real credentials, representative microphones, and supported browser capture surfaces.
- Configure Vercel public access or a domain for external smoke tests.
- Add production observability, redaction in platform logs, and deletion/retention jobs.

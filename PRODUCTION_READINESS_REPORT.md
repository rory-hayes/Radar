# Radar V1 Production Readiness Report

## Current Status

Radar V1 is a working local vertical slice and implementation scaffold. It is not production-ready until persistent storage, authentication, tenant isolation, and the real data plane are connected.

## Ready

- Next.js app compiles and builds.
- Chrome extension shell can be loaded unpacked and includes a microphone WebRTC transcription path.
- Server-only OpenAI key boundary is implemented.
- Realtime browser credential path uses server-minted client secrets.
- Citation and unsupported-claim rules are encoded in schemas and evals.
- Admin UI avoids seeded production data.
- Security and QA scripts are present and passing locally.

## Not Ready

- No production database persistence is wired.
- Session state currently uses in-memory storage.
- Tenant auth and role checks are contract/scaffold level, not fully enforced across a real auth provider.
- Admin API data source is not connected.
- Source ingestion, indexing, embeddings, and document permissions are not implemented end to end.
- Realtime transcription was implemented against official API contracts but not live-tested with an OpenAI key in this workspace.
- Extension tab-audio capture remains a gated shell; microphone transcription is implemented first.
- Deployment, observability, rate limiting, and incident runbooks are not configured.

## Required Before Pilot

- Add real auth and tenant membership resolution.
- Replace in-memory sessions with tenant-isolated persistent storage.
- Enforce authorization on every tenant-scoped API route.
- Connect approved source ingestion, freshness metadata, retrieval indexes, and citation storage.
- Exercise OpenAI Realtime transcription against real credentials, representative microphones, and supported browser capture surfaces.
- Add production rate limits, audit persistence, redaction in platform logs, and deletion/retention jobs.

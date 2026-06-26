# Radar V1 Production Readiness and Security Notes

## Current Contracts

- Tenant identity is represented by `Tenant`, `TenantMembership`, `TenantContext`, and tenant-scoped resource contracts in `src/lib/tenant`.
- Role permissions are centralized in `src/lib/tenant/permissions.ts`; product routes should call `assertTenantPermission` before reading or mutating tenant data.
- Audit events are defined in `src/lib/audit/events.ts`; server writers live behind `src/lib/audit/audit-service.ts` and redact metadata before persistence.
- Retention and deletion job contracts live in `src/lib/security/data-lifecycle.ts`.
- Usage metering contracts live in `src/lib/usage/ledger.ts` and require idempotency keys.
- Log redaction helpers live in `src/lib/security/redaction.ts`.

## Server-Only Secret Boundary

- `OPENAI_API_KEY` must only be accessed through `src/lib/security/server-secrets.ts`.
- That module imports `server-only` and is intentionally not exported from `src/lib/security/index.ts`.
- Browser and extension code must never read `process.env.OPENAI_API_KEY` and must never define `NEXT_PUBLIC_OPENAI_*`.
- Browser clients should receive only short-lived, tenant/session-scoped Realtime client secrets from server API routes after tenant, role, policy, and audit checks pass.

## Required Production Work Before Pilot

- Add persistent tenant, membership, audit, retention, deletion, and usage-ledger storage with database-level tenant isolation.
- Add auth/SSO integration and bind authenticated users to active tenant memberships.
- Add API route authorization checks for every tenant-scoped read/write.
- Add retention and deletion job implementations with dry-run reports, audit events, and restore verification.
- Add OpenAI Realtime client-secret API routes that call `getOpenAIApiKey` only on the server.
- Run `pnpm run qa:security` before every release candidate.

## Quality Gates

- `pnpm run typecheck`
- `pnpm run scan:no-dummy-data`
- `pnpm run scan:secrets`
- `pnpm run test:security`
- `pnpm run build`

## Known Gaps

- These files are scaffolding contracts, not a persistence layer.
- Audit events currently require a real writer before production use.
- Retention and deletion contracts do not yet execute background jobs.
- Real OpenAI Realtime, admin API, auth, database, and source-ingestion integrations still need production credentials and live-system verification.

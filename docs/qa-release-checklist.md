# Radar V1 QA and Release Checklist

## Security Checks

- Run `pnpm run qa:security`.
- Confirm no `NEXT_PUBLIC_OPENAI_*` variables are configured in deployment settings.
- Confirm `OPENAI_API_KEY` exists only as a server-side environment variable.
- Confirm browser and extension bundles do not import `src/lib/security/server-secrets.ts`.
- Confirm logs pass through `redactForLog` or an equivalent platform redaction layer.

## Tenant Checks

- Every tenant-scoped API route must resolve an active `TenantContext`.
- Every tenant-scoped resource read/write must compare resource `tenantId` to context `tenantId`.
- Mutations must check the narrowest permission needed for the operation.
- Cross-tenant access attempts must emit denied audit events without leaking resource data.

## Data Lifecycle Checks

- Retention jobs must support dry-run mode before destructive execution.
- Deletion jobs must audit request, execution, affected record counts, and failures.
- Raw audio storage must remain disabled unless a tenant explicitly opts in through policy.
- Usage ledger writes must use idempotency keys to avoid double billing or inflated reporting.

## Release Candidate Commands

```bash
pnpm run typecheck
pnpm run scan:no-dummy-data
pnpm run scan:secrets
pnpm run test:security
pnpm run build
```

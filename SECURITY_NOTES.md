# Radar V1 Security Notes

## Secret Boundary

- `OPENAI_API_KEY` is server-only.
- Browser and extension code must never import server secret helpers.
- Do not create or deploy `NEXT_PUBLIC_OPENAI_*` variables.
- Realtime clients must request short-lived credentials from Radar server routes after policy, tenant, and session checks.
- Realtime client secrets are passed to the offscreen document for the SDP handshake and are not persisted in extension storage.
- Configure `OPENAI_SAFETY_IDENTIFIER` or `RADAR_OPENAI_SAFETY_IDENTIFIER` server-side with a stable privacy-preserving user or tenant identifier before production.

## Tenant Boundary

- Tenant, membership, role, permission, and resource contracts live under `src/lib/tenant`.
- Production data routes must resolve tenant context before loading or mutating resources.
- Database-level tenant isolation and row-level access controls still need to be implemented.

## Evidence Boundary

- Answer and Proof cards require citations.
- Unsupported or weakly supported claims must return Needs confirmation or Escalate.
- Retrieval contracts filter by tenant, permission, approval state, and freshness before scoring.

## Data Handling

- Raw audio storage is disabled by default in the contracts.
- Audit events and redaction helpers are scaffolded.
- Retention and deletion jobs are specified but not executing yet.

## Local Security QA

Run:

```bash
pnpm run qa:security
```

This checks type safety, production dummy-data markers, client-exposed key patterns, and security contract tests.

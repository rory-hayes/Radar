# Radar Supabase Migrations

Create migrations with:

```bash
pnpm supabase:migration:new <snake_case_name>
```

The CLI writes timestamped SQL files into this directory. Keep one concern per migration and prefer names that match the RAD ticket, such as `rad_021_create_sources`.

## Rules

- Every customer-owned table must include `workspace_id` directly or be reachable through a workspace-owned parent.
- Enable RLS in the same migration that creates a customer-owned table.
- Do not create broad public grants for Radar product data.
- Do not store raw runner credentials, provider keys, webhook secrets, or source content in logs.
- Keep evidence and artifact references bounded; avoid copying large source payloads into many rows.
- Storage bucket migrations must default to private buckets unless a later ticket explicitly justifies public access.

RAD-021 through RAD-029 add the first product schemas, policies, storage, and migration test harness. RAD-006 only establishes the local pipeline.

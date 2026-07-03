# Demo Data Policy

Radar demo data exists to make local development and controlled demos repeatable. It must never become product logic.

## Allowed Environments

Demo seed data may run only in:

- `local`
- `test`

Demo seed data must not run in:

- `preview`
- `staging`
- `production`

## Seed Boundary

- `supabase/seed.sql` is the seed entrypoint loaded by `pnpm db:reset`.
- Future seed fragments belong under `supabase/seeds`.
- Seed files must be deterministic: stable IDs, stable timestamps where practical, stable slugs, and idempotent reset behaviour through `pnpm db:reset`.
- Every seeded customer-owned record must be workspace-scoped with `workspace_id` or through a workspace-owned parent.
- Seed records must use synthetic Radar examples only. Do not use real customer names, domains, documents, support answers, credentials, endpoint URLs, or webhook secrets.

## Product Runtime Boundary

Product routes, server actions, repositories, and UI components must read from the database or typed application state. They must not import seed files, fixture files, or hardcoded product result arrays.

Allowed:

- deterministic local workspace records created through Supabase seed SQL,
- static policy metadata such as allowed demo environments,
- local-only demo records that exercise the locked assertion-led model.

Not allowed:

- hardcoded checks-run counts in product routes,
- hardcoded findings or recommended fixes in product components,
- demo-only branches that can execute in preview, staging, or production,
- real source content copied into seed files,
- provider keys, runner credentials, webhook secrets, or service role keys in seed files.

## Local Reset Contract

Use:

```bash
pnpm db:reset
```

That command applies migrations and then runs `supabase/seed.sql`. RAD-019 keeps `seed.sql` as the entrypoint and includes `supabase/seeds/radar-demo-workspace.sql` for deterministic local/test users, one demo workspace, workspace memberships, and representative audit activity.

The Phase 1 seed must not create source, assertion, run, or finding tables ahead of their data-model tickets. Until those schemas exist, sample source/assertion/finding examples may appear only as workspace-scoped audit metadata that demonstrates the intended local scenario.

## Future Seed Shape

When the workspace and core data model exist, seed files should follow this order:

1. Workspace and membership records.
2. Sources and source documents.
3. Assertions and linked sources.
4. Test cases and runner config.
5. Evaluation runs, results, findings, evidence, and activity.

Each layer must preserve the Radar model: assertions define the business truth first, sources are attached only when needed, and findings are evidence-backed.

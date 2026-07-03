# Test Strategy

Radar must be built carefully enough to avoid slop. Every task should add or update tests where the behavior changes.

## Test layers

1. Unit tests — pure functions, validators, scoring, parsers, formatters.
2. Integration tests — database repositories, RLS expectations, API/server actions, jobs.
3. E2E tests — browser flows through the four core pages and runner workflows.
4. Security tests — auth, workspace isolation, secret redaction, upload limits, route guards.
5. Performance smoke tests — `pnpm perf:pilot` models pilot-scale ingestion, embedding scheduling, eval job throughput, and dashboard aggregation budgets without external services.
6. Smoke tests — build, app boot, page navigation, seed data, production deploy health.

## E2E gate rule

Every tenth task is an E2E gate. Codex must not continue to the next phase if the gate fails unless the issue is documented, scoped, and deliberately deferred.

## Required checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm perf:pilot
```

## Manual QA

Each task file includes manual QA steps. Codex must update them if implementation changes.

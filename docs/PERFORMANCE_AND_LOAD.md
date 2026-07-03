# Performance And Load Testing

RAD-098 adds a repeatable local pilot-load smoke test for Radar's launch-critical paths.

## Command

```bash
pnpm perf:pilot
```

The script prints JSON metrics and exits non-zero when a budget is exceeded.

## Pilot profile

The smoke profile models one pilot workspace with:

- 120 sources.
- 3 assertions per source.
- 4 test cases per assertion.
- 900 evaluation runs.
- 18% simulated finding rate.
- Embedding scheduling in batches of 100 chunks with concurrency 4.
- Evaluation job scheduling with concurrency 12.

This is intentionally above the expected first-pilot steady state so regressions are visible before production launch.

## Covered paths

- Source ingestion pressure: synthetic document generation, hashing, chunking, and source/assertion relationship creation.
- Embedding throughput: missing-chunk batching and bounded concurrent scheduling.
- Evaluation throughput: queued run claiming, concurrent worker scheduling, terminal result generation, and finding creation pressure.
- Dashboard query pressure: aggregation over sources, assertions, runs, and open findings.

The harness avoids network calls, LLM calls, browser automation, and Supabase writes so it can run in CI and local Codex sessions without external services. It complements, but does not replace, database-backed load tests once a staging Supabase project is available.

## Budgets

| Area | Budget |
| --- | ---: |
| Source ingestion simulation | 650 ms |
| Embedding scheduling simulation | 250 ms |
| Evaluation scheduling simulation | 350 ms |
| Dashboard aggregation simulation | 120 ms |
| Total script runtime | 1200 ms |

## Latest local smoke

Run on 2026-07-03:

| Area | Measured |
| --- | ---: |
| Source ingestion simulation | 7.42 ms |
| Embedding scheduling simulation | 0.14 ms |
| Evaluation scheduling simulation | 1.70 ms |
| Dashboard aggregation simulation | 0.24 ms |
| Total script runtime | 9.53 ms |

Throughput covered 120 source documents, 600 chunks, 6 embedding batches, 900 evaluation runs, 157 findings, and 1537 dashboard aggregation items.

## Production follow-up

Before opening a larger pilot, run the same workload against staging with real Supabase, OpenAI embeddings, Journey Runner browser sessions, and Integration Runner HTTP checks. Capture p50/p95 latency, queue depth, job retry rate, database CPU, storage egress, and API provider rate-limit events.

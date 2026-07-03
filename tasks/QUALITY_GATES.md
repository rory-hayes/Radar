# Quality Gates

Radar uses quality gates to prevent Codex-driven drift and slop.

## Gate cadence

Every tenth task is an E2E gate:

- RAD-010 — Foundation smoke test
- RAD-020 — Auth and workspace isolation
- RAD-030 — Core data model CRUD and isolation
- RAD-040 — Source ingestion to evidence retrieval
- RAD-050 — Assertions to runnable test cases
- RAD-060 — Knowledge eval to traceable result
- RAD-070 — Runner triad smoke test
- RAD-080 — Failure to fix to resolved
- RAD-090 — Executive dashboard and report flow
- RAD-100 — Production launch readiness

## Required gate output

Each gate must produce:

- Tests run.
- Pass/fail summary.
- Regressions found.
- Fixes applied.
- Deferred issues.
- Recommendation: proceed or stop.

## Gate failure policy

Do not continue after a failed gate unless the failure is documented, non-blocking, and explicitly accepted.

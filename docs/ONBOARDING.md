# Onboarding Activation

Radar activation is assertion-led. A workspace is considered activated after it has enough real product state to reach a meaningful first check:

1. connect a source,
2. create an assertion,
3. approve runner coverage with at least one test case,
4. run a check,
5. review either an evidence-backed finding or the weekly trust report.

The activation checklist is computed from workspace-owned sources, assertions, approved test cases, evaluation runs, and findings. It does not store duplicate onboarding state and does not add a separate onboarding product surface.

## UI placement

The checklist appears on Command Center because that is where a new workspace expects operational readiness. It uses existing shadcn primitives and deep-links into Sources, Assertions, assertion detail, Findings, and the weekly report.

Locked steps remain visible but inactive until prior milestones are complete. This keeps the flow guided without pushing users into integration-led setup.

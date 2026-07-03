# E2E Test Plan

This file defines the end-to-end flows Radar must support by production readiness.

## Core E2E flow

1. User signs in.
2. User creates or opens workspace.
3. User adds a source.
4. Radar indexes the source.
5. User creates or approves an assertion.
6. Radar generates test cases.
7. User runs an evaluation.
8. Radar creates a finding if something fails.
9. User opens finding evidence.
10. User applies/simulates a fix.
11. User reruns the assertion.
12. Finding resolves.
13. Command Center updates.
14. Report/notification reflects the state.

## Required E2E coverage by runner

- Knowledge Runner: docs/policy versus support answer mismatch.
- Journey Runner: signup/onboarding flow success or failure.
- Integration Runner: generic API/webhook side effect check.

## Browser coverage

Use Chromium for required CI. Add Firefox/WebKit later if needed.

## Data policy

Use deterministic test workspaces and seeds. Never rely on live customer data in automated tests.

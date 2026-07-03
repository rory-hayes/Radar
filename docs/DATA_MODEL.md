# Data Model

This file defines the core database entities Radar needs from MVP through production readiness.

## Core tables

- workspaces
- users or profiles
- workspace_members
- audit_logs
- sources
- source_documents
- source_chunks
- assertions
- assertion_sources
- assertion_templates
- test_cases
- runner_configs
- evaluation_runs
- test_case_results
- findings
- finding_evidence
- finding_activity
- reports
- notifications
- billing_customers

## Workspace ownership

Every product table that contains customer data must include workspace_id directly or be reachable through a workspace-owned parent with enforced RLS.

RAD-012 establishes the first tenant boundary:

- `workspaces` owns customer-facing assertions, sources, runner configurations, runs, findings, reports, and future billing records.
- `workspace_members` maps Supabase Auth users to a workspace with `admin`, `editor`, or `viewer` role values.
- First-workspace creation happens through `create_workspace_with_admin_membership(...)` so the workspace row and initial admin membership are created in one database transaction.
- Initial RLS allows authenticated workspace members to read their workspaces and memberships. Broader product-table policies are added with each data-model ticket and hardened in the RLS phase.

## Evidence references

Evaluation results and findings should reference source documents/chunks and artifact files rather than copying unbounded content into many records.

## Audit logs

RAD-016 adds `audit_logs` as the append-only event trail for auth, workspace, source, assertion, run, and finding changes. Every audit event stores workspace, actor, action, resource type, optional resource ID, metadata, and timestamp. Workspace-scoped events are readable by active workspace members; auth events without a workspace are readable by the acting user.

## Sources and Evidence Input

RAD-021 adds the first source-of-truth persistence layer:

- `sources` stores workspace-owned evidence inputs such as URLs, uploaded documents, manual text, API endpoints, and support bot endpoints.
- `source_versions` stores deterministic sync snapshots with content hashes, document/chunk counts, status, timing, and metadata.
- `source_documents` stores extracted document records owned by a source version, with hash, MIME/storage metadata, extraction status, and error state.
- `source_chunks` stores bounded text chunks and optional pgvector embeddings for later evidence retrieval.

Every source table has direct `workspace_id` ownership and RLS. Source content may be stored in `source_chunks.content`, but it must not be copied into logs, analytics, or unbounded metadata fields.

## Assertions and Test Cases

RAD-022 adds the assertion-led verification layer:

- `assertions` stores workspace-owned business truths with purpose, expected behavior, category, priority, runner type, status, owner, creator, and bounded metadata.
- `assertion_sources` links assertions to the minimum evidence sources needed to verify the business truth.
- `assertion_templates` stores system or workspace-scoped starting points for common business assertions without creating a generic marketplace.
- `assertion_runs_schedule` stores cadence, timezone, source-change trigger, and enabled state for later runner orchestration.
- `test_cases` stores customer questions, journey scenarios, and integration checks linked to a single assertion.

Every assertion and test-case table has `workspace_id` ownership. System templates are the only assertion records without a workspace, and they must stay generic and free of customer data. Repository helpers for product CRUD are added later; product code must not query these tables ad hoc from UI components.

## Evaluation Runs and Results

RAD-023 adds durable run history:

- `evaluation_runs` stores one execution attempt for an assertion, including runner type, trigger type, lifecycle status, aggregate counts, score, confidence, evidence references, and execution metadata.
- `test_case_results` stores per-test-case outcomes for a run, including status, score, confidence, actual output summary, evaluator summary, evidence references, timing, and execution metadata.

Both tables are directly workspace-owned and also constrained back to workspace-owned assertions and test cases. Evidence references are bounded JSON arrays that point to source chunks, source documents, or storage artifacts; they must not duplicate raw documents or runner secrets.

## Versioning

Sources, prompts, rubrics, runner definitions, and assertion templates must be versioned so historical runs remain explainable.

## Sensitive data

Secrets and credentials must be encrypted or stored in provider-managed secret stores. Sensitive source content must not be logged to analytics, Sentry, or external traces.

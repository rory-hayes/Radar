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

RAD-027 adds RLS hardening through centralized workspace membership helper functions, forced RLS on workspace-owned product tables, and role-scoped storage object policies for evidence artifacts. Storage object paths must start with the owning workspace UUID so private artifact access can be checked with the same membership model as database rows.

## Evidence references

Evaluation results and findings should reference source documents/chunks and artifact files rather than copying unbounded content into many records.

## Evidence artifact storage

RAD-028 stores binary and exported evidence in the private `radar-evidence-artifacts` bucket. Artifact paths must follow `<workspaceId>/<artifactKind>/<ownerId>/<fileName>`, where `artifactKind` is one of `uploaded-document`, `source-snapshot`, `screenshot`, `run-artifact`, or `report-export`. Database rows should store only bounded storage paths, citations, hashes, and summaries, not duplicated full artifact bodies.

## Audit logs

RAD-016 adds `audit_logs` as the append-only event trail for auth, workspace, source, assertion, run, and finding changes. Every audit event stores workspace, actor, action, resource type, optional resource ID, metadata, and timestamp. Workspace-scoped events are readable by active workspace members; auth events without a workspace are readable by the acting user.

## Sources and Evidence Input

RAD-021 adds the first source-of-truth persistence layer:

- `sources` stores workspace-owned evidence inputs such as URLs, uploaded documents, manual text, API endpoints, and support bot endpoints.
- `source_versions` stores deterministic sync snapshots with content hashes, document/chunk counts, status, timing, and metadata.
- `source_documents` stores extracted document records owned by a source version, with hash, MIME/storage metadata, extraction status, and error state.
- `source_chunks` stores bounded text chunks and optional pgvector embeddings for later evidence retrieval.

Every source table has direct `workspace_id` ownership and RLS. Source content may be stored in `source_chunks.content`, but it must not be copied into logs, analytics, or unbounded metadata fields.

RAD-033 adds the first URL ingestion boundary. The crawler accepts only safe `http` and `https` URLs, blocks local/private hosts, applies timeout and byte limits, checks robots.txt when available, keeps sitemap ingestion same-origin and capped, extracts bounded readable text, and stores stable SHA-256 content hashes. Persisted URL crawl output flows through `source_versions`, `source_documents`, and `source_chunks`; crawler metadata stays small and must not include credentials, raw headers, or unrelated site-wide crawl state.

RAD-034 adds uploaded document extraction for PDF, Markdown, and TXT files. Upload processing validates MIME type, extension, and size, stores the original artifact under the private `uploaded-document` storage path, extracts bounded text, writes stable content hashes, and persists the extracted text through `source_documents` and `source_chunks`. Basic PDF extraction handles text-based PDFs only; failures are recorded on the source sync state instead of logging raw document content.

RAD-035 adds the source sync job boundary. Sync jobs mark supported sources as `syncing`, fetch or extract bounded content, compare the resulting content hash against existing `source_versions`, skip unchanged snapshots without inserting duplicate versions, and mark failures on `sources.last_sync_error` while preserving the previous content hash for explainability. URL and manual text sources can be resynced directly; uploaded documents require a new file payload, and endpoint sources wait for their runner-specific execution paths.

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

## Findings and Evidence

RAD-024 adds the evidence-backed issue layer:

- `findings` stores customer-readable issues with expected versus actual behavior, severity, confidence, customer impact, recommended fix, owner, lifecycle status, dedupe key, and resolution fields.
- `finding_evidence` stores bounded citations to source chunks, source documents, run outputs, artifacts, or manual notes.
- `finding_assignments` stores assignment history for ownership changes.
- `finding_activity` stores lifecycle events, comments, assignment events, linked reruns, and evidence additions.

Findings are workspace-owned and tied back to assertions, evaluation runs, and test-case results. Evidence rows may point to source and run records, but they must not copy full source documents or raw runner secrets.

## Versioning

Sources, prompts, rubrics, runner definitions, and assertion templates must be versioned so historical runs remain explainable.

## Sensitive data

Secrets and credentials must be encrypted or stored in provider-managed secret stores. Sensitive source content must not be logged to analytics, Sentry, or external traces.

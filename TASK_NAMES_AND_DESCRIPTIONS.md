# Radar Task Names and Descriptions

This is the full task list from zero to controlled production readiness.

## Phase 0 — Foundation
- RAD-001 — Initialize repo and baseline Next.js application: Create or normalize the project foundation so Radar has a clean Next.js application structure, package scripts, TypeScript config, and predictable local development workflow.
- RAD-002 — Add AGENTS.md and engineering operating rules: Add the repository-level instructions Codex must follow on every task, including scope control, no unrelated refactors, no mock production data, tests-first discipline, and status updates.
- RAD-003 — Install and configure core frontend stack and shadcn MCP workflow: Install and configure Tailwind, shadcn/ui conventions, React Hook Form, Zod, lucide icons, class utilities, and baseline component folders.
- RAD-004 — Create typed environment and secrets validation: Implement typed environment loading and validation so missing Supabase, OpenAI, Trigger.dev, PostHog, Sentry, Resend, and Stripe values fail safely in the correct environments.
- RAD-005 — Set up CI quality baseline: Add GitHub Actions or equivalent CI checks for install, lint, typecheck, unit tests, and build so every Codex PR is automatically gated.
- RAD-006 — Add Supabase local development and migration pipeline: Create Supabase project configuration, migration folder conventions, local development instructions, and database reset/seed scripts.
- RAD-007 — Create Radar app route structure and shell: Create the authenticated app route group and public route group with placeholder pages for Command Center, Assertions, Findings, Sources, and Settings hidden behind feature flag if needed.
- RAD-008 — Implement enterprise design tokens and base components: Define Radar's serious enterprise visual system: neutral palette, typography scale, spacing, cards, tables, badges, empty states, buttons, alerts, and status chips.
- RAD-009 — Create demo data policy and local seed contract: Define how local/demo data is generated for development while ensuring production features use real database-backed data and no hardcoded product results.
- RAD-010 — E2E Gate 1 — Foundation smoke test: Run an end-to-end smoke test across install, local app launch, route navigation, CI commands, and basic UI rendering to confirm the foundation is stable before product work continues.

## Phase 1 — Auth and Workspaces
- RAD-011 — Implement Supabase authentication: Wire Supabase Auth into the app with sign in, sign out, session loading, route protection, and server-side auth helpers.
- RAD-012 — Create workspace and membership model: Implement workspaces and workspace_members tables plus creation flow so Radar is multi-tenant from the beginning.
- RAD-013 — Implement RBAC permission guards: Add Admin, Editor, and Viewer roles with server-side and UI-level permission checks for create, edit, delete, rerun, and resolve actions.
- RAD-014 — Build minimal authenticated navigation: Implement the left navigation and top bar for Command Center, Assertions, Findings, and Sources with active states, workspace selector placeholder, search affordance, and user menu.
- RAD-015 — Add workspace settings basics: Create a basic workspace settings page for name, slug, team visibility, and environment indicators without expanding into admin bloat.
- RAD-016 — Add audit log infrastructure: Create audit log schema, write helper, and initial events for auth, workspace, source, assertion, run, and finding changes.
- RAD-017 — Create server-side API and action guardrails: Standardize server actions/API handlers with auth, workspace resolution, input validation, error mapping, and response conventions.
- RAD-018 — Implement loading, empty, and error states: Add reusable loading skeletons, empty states, error callouts, retry affordances, and not-found handling across the app shell.
- RAD-019 — Seed first demo workspace and users: Add a deterministic demo workspace seed that shows sample assertions, sources, findings, and activity for local development and demos.
- RAD-020 — E2E Gate 2 — Auth and workspace isolation: Run an end-to-end gate that signs in, creates/switches workspace context, verifies route protection, verifies RBAC, and confirms no cross-workspace data leakage.

## Phase 2 — Core Data Model
- RAD-021 — Create sources, documents, and chunks schema: Add the database tables for sources, source_documents, source_chunks, versions, hashes, metadata, and sync state.
- RAD-022 — Create assertions and test cases schema: Add assertions, assertion_sources, assertion_templates, assertion_runs_schedule, and test_cases tables with required workspace ownership and status fields.
- RAD-023 — Create evaluation runs and result schema: Add evaluation_runs and test_case_results tables with statuses, scores, confidence, evidence references, runner type, and execution metadata.
- RAD-024 — Create findings and evidence schema: Add findings, finding_evidence, finding_activity, finding_assignments, and resolution state fields.
- RAD-025 — Implement type-safe repository layer: Create typed data access functions for workspaces, sources, assertions, runs, findings, and evidence, avoiding scattered raw queries in UI components.
- RAD-026 — Create shared Zod validation schemas: Define request/response schemas for sources, assertions, test cases, eval runs, findings, and workspace actions.
- RAD-027 — Implement Supabase RLS policies: Add row-level security policies for all product tables and storage buckets based on workspace membership and role.
- RAD-028 — Configure storage buckets for evidence artifacts: Set up private storage buckets and access helpers for uploaded documents, extracted source snapshots, screenshots, run artifacts, and report exports.
- RAD-029 — Create migration and seed test harness: Add scripts/tests that apply migrations, seed representative records, and verify expected constraints, indexes, and RLS behaviours.
- RAD-030 — E2E Gate 3 — Core data model CRUD and isolation: Run a full data-model E2E gate covering create/read/update/delete for sources, assertions, test cases, runs, findings, and evidence across multiple workspaces.

## Phase 3 — Sources and Evidence
- RAD-031 — Build Sources page list and source cards: Implement the Sources page using real database-backed data with source cards/list rows for URL, docs, uploads, manual text, API endpoint, and support bot endpoint.
- RAD-032 — Build source create and edit flow: Create forms to add/edit URL sources, uploaded files, manual policy text, and endpoint-style sources with validation and workspace ownership.
- RAD-033 — Implement URL crawler and text extraction: Add a safe crawler for single URL and sitemap/page ingestion with content extraction, deduping, timeout handling, robots/limits policy, and metadata capture.
- RAD-034 — Implement file upload and text extraction: Support PDF, Markdown, TXT, and basic document uploads with extraction, size limits, MIME validation, and failure feedback.
- RAD-035 — Implement source sync jobs and versioning: Create background jobs to sync sources, calculate content hashes, detect changes, store versions, and update source health.
- RAD-036 — Build chunking and embedding pipeline: Chunk source documents, generate embeddings, store them with pgvector metadata, and support incremental re-indexing on changed content.
- RAD-037 — Create evidence retrieval API: Implement source search/retrieval endpoints that accept workspace, assertion/test case context, and return ranked evidence chunks with citations and source metadata.
- RAD-038 — Build source detail page: Create source detail views showing versions, sync history, extracted content preview, affected assertions, errors, and manual re-sync action.
- RAD-039 — Implement affected assertion detection: Link sources to assertions and identify which assertions should rerun when a source changes, including manual and auto-generated relationships.
- RAD-040 — E2E Gate 4 — Source ingestion to evidence retrieval: Run E2E coverage that creates sources, crawls/uploads content, indexes it, retrieves relevant evidence, shows source health, and prevents unauthorized access.

## Phase 4 — Assertions and Test Cases
- RAD-041 — Build Assertions page table and filters: Implement the Assertions page with real data, filters by status/category/owner/priority/runner type, search, pagination, and empty states.
- RAD-042 — Build assertion create and edit flow: Create forms/drawers for assertion name, purpose, expected behaviour, category, priority, owner, schedule, runner type, and evidence sources.
- RAD-043 — Build assertion detail page foundation: Create the assertion drill-down shell with summary, metadata, linked sources, test cases, run history placeholder, findings placeholder, and actions.
- RAD-044 — Implement assertion-source linking: Allow users to attach existing sources to assertions and show the minimum required source coverage for the assertion.
- RAD-045 — Create first assertion packs and templates: Implement V1 templates for Pricing & Plan Accuracy, Refund & Cancellation, Trial & Onboarding, Billing & Invoices, and Support Escalation.
- RAD-046 — Implement AI suggested assertion generator: Use source content and workspace context to propose assertions with purpose, category, required sources, priority, and suggested runner type.
- RAD-047 — Build test case CRUD: Allow users to create, edit, approve, disable, and delete test cases linked to assertions.
- RAD-048 — Implement AI test case generator: Generate realistic customer questions and scenarios for approved assertions using source evidence and assertion purpose.
- RAD-049 — Implement schedules and manual triggers: Add schedule fields, run cadence options, source-change trigger flags, and manual run controls without executing full eval logic yet.
- RAD-050 — E2E Gate 5 — Assertions to runnable test cases: Run E2E coverage that creates sources, generates/approves assertions, generates/edits test cases, links sources, and verifies schedules and permissions.

## Phase 5 — Evaluation Engine and Knowledge Runner
- RAD-051 — Create evaluation job orchestration: Implement Trigger.dev jobs or equivalent abstractions for queueing, running, retrying, and tracking assertion evaluation jobs.
- RAD-052 — Implement LLM provider abstraction and prompt contracts: Create a server-only LLM adapter for generation, judging, summarization, and fix recommendations with strict prompt/version logging.
- RAD-053 — Implement assertion evidence loading: Before each test, retrieve relevant evidence chunks and source snapshots based on assertion/test case context.
- RAD-054 — Build target endpoint configuration: Allow a workspace to configure AI support endpoints, generic HTTP targets, or uploaded answer sets required by a Knowledge Runner assertion.
- RAD-055 — Implement Knowledge Runner execution loop: Run question/test case inputs against the configured target, capture actual answers, attach evidence, and produce raw test outputs.
- RAD-056 — Implement hybrid evaluator rubric: Score answers using source-grounding, contradiction detection, completeness, refusal behaviour, citation validity, policy consistency, and LLM judge summary.
- RAD-057 — Persist test case results and scoring: Store per-test results with pass/warning/fail/inconclusive/error status, score, confidence, summaries, and evidence refs.
- RAD-058 — Build eval run history UI: Show latest run state and historical run summaries on the assertion detail page, including pass rate and first failure markers.
- RAD-059 — Implement manual rerun action: Add server-side action and UI button to rerun an assertion or specific failed test case with permission checks and run status feedback.
- RAD-060 — E2E Gate 6 — Knowledge eval to traceable result: Run E2E coverage where a source-backed assertion calls a target answer, detects mismatch, stores evidence-backed test results, and supports manual rerun.

## Phase 6 — Journey and Integration Runners
- RAD-061 — Create shared runner interface: Define a common runner contract for Knowledge, Journey, and Integration runners including inputs, outputs, status, errors, evidence artifacts, and retry semantics.
- RAD-062 — Implement Playwright Journey Runner foundation: Set up Playwright execution, browser contexts, screenshot capture, trace artifact storage, timeouts, and safe credential handling.
- RAD-063 — Create journey step definition schema: Define a simple schema for URL visits, clicks, text entry, assertions, waits, emails, screenshots, and success conditions without building a visual workflow canvas.
- RAD-064 — Build Trial & Onboarding journey pack: Create the first Journey Runner template for signup/trial/onboarding checks using configurable URLs, test credentials, and expected success states.
- RAD-065 — Add email receipt verification utility: Implement a test mailbox/webhook utility to verify whether expected emails such as welcome, invoice, or cancellation confirmations were received.
- RAD-066 — Implement Integration Runner foundation: Create the Integration Runner for basic API/webhook checks, including HTTP request execution, response validation, auth headers, and result capture.
- RAD-067 — Build generic webhook and API assertion checks: Support assertions such as webhook fired, API returned expected state, ticket endpoint accepted request, or billing object updated.
- RAD-068 — Create minimal handoff templates: Add templates for email sent, support ticket created, CRM task created, webhook event received, and billing status changed using generic API or webhook evidence.
- RAD-069 — Harden runner credential handling: Encrypt runner credentials, redact secrets from logs/artifacts, enforce workspace isolation, and add credential test actions.
- RAD-070 — E2E Gate 7 — Runner triad smoke test: Run E2E coverage across one Knowledge assertion, one Journey assertion, and one Integration assertion, proving shared runner contracts and artifacts work.

## Phase 7 — Findings and Recommended Fixes
- RAD-071 — Implement findings creation engine: Convert failed/warning evaluation results into deduplicated findings with severity, confidence, impacted assertion, evidence, and first/last seen tracking.
- RAD-072 — Build Findings inbox page: Create the issue inbox with filters, severity chips, confidence, owner, status, affected assertion, customer impact, and searchable finding list.
- RAD-073 — Build finding detail panel: Show selected finding details with actual vs expected, source evidence, impacted assertions, run links, activity, owner, status, and actions.
- RAD-074 — Implement evidence diff and mismatch highlighting: Render policy/source excerpts against actual answers or journey results with highlighted mismatches and citations.
- RAD-075 — Implement severity and customer impact model: Add severity rules that combine assertion priority, failure type, affected journey, confidence, repeat count, and customer-facing impact.
- RAD-076 — Implement recommended fix generator: Generate concise recommended fixes based on evidence, failure type, source owner, and runner output with a no-hallucination guardrail.
- RAD-077 — Build finding lifecycle workflow: Support Open, Investigating, Fixed, Resolved, Ignored, and False Positive statuses with audit log events and permission checks.
- RAD-078 — Add assignment and ownership updates: Allow authorized users to assign findings to owners, change priority, add notes, and filter by owner/team.
- RAD-079 — Implement rerun-after-fix and resolution linking: Link reruns to findings and allow a passing rerun to suggest or complete resolution depending on workspace settings.
- RAD-080 — E2E Gate 8 — Failure to fix to resolved: Run E2E coverage where a failed assertion creates a finding, shows evidence, generates a fix, assigns owner, reruns after a simulated fix, and resolves.

## Phase 8 — Command Center, Reports, Alerts
- RAD-081 — Build Command Center KPI summary: Create the executive summary cards for checks run, exceptions, critical issues, recommended fixes, pass rate, and trend indicators.
- RAD-082 — Build Needs Attention panel: Show the most important open findings with severity, confidence, impact, affected assertion, and primary recommended fix.
- RAD-083 — Build assertion health by category: Create grouped health summaries for Pricing, Refund/Cancellation, Onboarding, Billing/Invoices, Support Escalation, and custom categories.
- RAD-084 — Build recent activity feed: Add an activity feed for source syncs, assertions run, findings opened/resolved, reruns, and report generation.
- RAD-085 — Implement weekly trust report generator: Generate a weekly report summary with checks run, pass rate, exceptions, resolved findings, risky categories, and recommended next actions.
- RAD-086 — Build report page and export scaffold: Create a report detail page and export-ready data structure for future PDF/email delivery.
- RAD-087 — Implement email notifications with Resend: Send transactional notifications for critical findings, weekly report availability, failed source sync, and invited workspace users.
- RAD-088 — Implement Slack webhook alerts: Add optional Slack incoming webhook notifications for critical findings and daily summary without building full Slack OAuth yet.
- RAD-089 — Add product analytics and event taxonomy: Track key product events with PostHog or equivalent, including source added, assertion approved, run completed, finding opened, fix rerun, and report viewed.
- RAD-090 — E2E Gate 9 — Executive dashboard and report flow: Run E2E coverage from source/assertion/run/finding through Command Center summary, alert generation, and weekly report creation.

## Phase 9 — Production Readiness
- RAD-091 — Implement Stripe billing and plan gates: Add Stripe customer/subscription flow, plan limits for assertions/sources/runs, billing portal access, and safe unpaid states.
- RAD-092 — Build onboarding checklist and activation flow: Create a guided activation flow that helps users create first source, assertion, runner config, first run, and first finding/report.
- RAD-093 — Add Sentry error monitoring and release tracking: Instrument frontend and backend errors, source maps, release versions, and key context without leaking secrets/source content.
- RAD-094 — Add Langfuse internal LLM tracing: Instrument internal LLM calls for assertion generation, test case generation, judging, and fixes with prompt versions, costs, latency, and redacted metadata.
- RAD-095 — Implement rate limits, quotas, and abuse controls: Add per-workspace and per-user limits for source syncs, eval runs, AI calls, file sizes, runner duration, and API requests.
- RAD-096 — Run security hardening and secrets audit: Review auth, RLS, server-only secrets, webhook validation, upload scanning, CSP/headers, dependency audit, and sensitive logging.
- RAD-097 — Implement data deletion, export, and retention controls: Add source deletion, artifact cleanup, workspace export, retention settings, and documented data handling paths.
- RAD-098 — Run performance and load testing: Test source ingestion, embedding, eval runs, dashboard queries, and concurrent jobs against realistic pilot-scale workloads.
- RAD-099 — Create production deployment and operations runbook: Document environments, deployment steps, rollback, migrations, cron/job operations, incident response, backups, and support procedures.
- RAD-100 — E2E Gate 10 — Production launch readiness: Run the final production-readiness gate covering full product flow, security, billing, observability, performance, alerts, rollback, and pilot customer acceptance.

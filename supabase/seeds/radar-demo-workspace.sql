-- RAD-019 deterministic local/test seed.
-- This file may run only through the local Supabase seed entrypoint.
-- It seeds only schemas that exist in completed data-model tickets.
-- Future product tables must be added here only after their migrations land.

begin;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'admin@radar-demo.test',
    '2026-07-03 09:00:00+00',
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"name": "Radar Demo Admin", "demo_role": "admin"}'::jsonb,
    '2026-07-03 09:00:00+00',
    '2026-07-03 09:00:00+00'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'editor@radar-demo.test',
    '2026-07-03 09:00:00+00',
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"name": "Radar Demo Editor", "demo_role": "editor"}'::jsonb,
    '2026-07-03 09:00:00+00',
    '2026-07-03 09:00:00+00'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'viewer@radar-demo.test',
    '2026-07-03 09:00:00+00',
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"name": "Radar Demo Viewer", "demo_role": "viewer"}'::jsonb,
    '2026-07-03 09:00:00+00',
    '2026-07-03 09:00:00+00'
  )
on conflict (id) do update
set
  email = excluded.email,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = excluded.updated_at;

insert into public.workspaces (
  id,
  name,
  slug,
  status,
  created_by,
  created_at,
  updated_at,
  team_visibility
)
values (
  '20000000-0000-4000-8000-000000000001',
  'Radar Demo Workspace',
  'radar-demo-workspace',
  'active',
  '10000000-0000-4000-8000-000000000001',
  '2026-07-03 09:05:00+00',
  '2026-07-03 09:05:00+00',
  'workspace'
)
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  status = excluded.status,
  team_visibility = excluded.team_visibility,
  updated_at = excluded.updated_at;

insert into public.workspace_members (
  workspace_id,
  user_id,
  role,
  status,
  invited_by,
  joined_at,
  created_at,
  updated_at
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'admin',
    'active',
    null,
    '2026-07-03 09:05:00+00',
    '2026-07-03 09:05:00+00',
    '2026-07-03 09:05:00+00'
  ),
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    'editor',
    'active',
    '10000000-0000-4000-8000-000000000001',
    '2026-07-03 09:06:00+00',
    '2026-07-03 09:06:00+00',
    '2026-07-03 09:06:00+00'
  ),
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    'viewer',
    'active',
    '10000000-0000-4000-8000-000000000001',
    '2026-07-03 09:07:00+00',
    '2026-07-03 09:07:00+00',
    '2026-07-03 09:07:00+00'
  )
on conflict (workspace_id, user_id) do update
set
  role = excluded.role,
  status = excluded.status,
  invited_by = excluded.invited_by,
  joined_at = excluded.joined_at,
  updated_at = excluded.updated_at;

insert into public.sources (
  id,
  workspace_id,
  name,
  description,
  type,
  sync_status,
  origin_uri,
  config,
  metadata,
  content_hash,
  last_synced_at,
  last_sync_error,
  created_by,
  created_at,
  updated_at
)
values (
  '40000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  'Pricing policy source',
  'Synthetic local policy source for pricing assertion demos.',
  'manual_text',
  'synced',
  null,
  '{"demo": true, "captureMode": "manual"}'::jsonb,
  '{"demo": true, "category": "pricing"}'::jsonb,
  'radar-demo-pricing-policy-v1-hash',
  '2026-07-03 09:10:00+00',
  null,
  '10000000-0000-4000-8000-000000000001',
  '2026-07-03 09:10:00+00',
  '2026-07-03 09:10:00+00'
)
on conflict (id) do update
set
  workspace_id = excluded.workspace_id,
  name = excluded.name,
  description = excluded.description,
  type = excluded.type,
  sync_status = excluded.sync_status,
  origin_uri = excluded.origin_uri,
  config = excluded.config,
  metadata = excluded.metadata,
  content_hash = excluded.content_hash,
  last_synced_at = excluded.last_synced_at,
  last_sync_error = excluded.last_sync_error,
  updated_at = excluded.updated_at;

insert into public.source_versions (
  id,
  workspace_id,
  source_id,
  version_number,
  sync_status,
  content_hash,
  document_count,
  chunk_count,
  sync_started_at,
  sync_completed_at,
  sync_error,
  metadata,
  created_at,
  updated_at
)
values (
  '41000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  1,
  'synced',
  'radar-demo-pricing-policy-v1-hash',
  1,
  1,
  '2026-07-03 09:10:00+00',
  '2026-07-03 09:11:00+00',
  null,
  '{"demo": true, "syncReason": "initial-demo-seed"}'::jsonb,
  '2026-07-03 09:11:00+00',
  '2026-07-03 09:11:00+00'
)
on conflict (id) do update
set
  workspace_id = excluded.workspace_id,
  source_id = excluded.source_id,
  version_number = excluded.version_number,
  sync_status = excluded.sync_status,
  content_hash = excluded.content_hash,
  document_count = excluded.document_count,
  chunk_count = excluded.chunk_count,
  sync_started_at = excluded.sync_started_at,
  sync_completed_at = excluded.sync_completed_at,
  sync_error = excluded.sync_error,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.source_documents (
  id,
  workspace_id,
  source_id,
  source_version_id,
  title,
  document_uri,
  mime_type,
  storage_path,
  status,
  content_hash,
  byte_size,
  extracted_at,
  extraction_error,
  metadata,
  created_at,
  updated_at
)
values (
  '42000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  '41000000-0000-4000-8000-000000000001',
  'Pricing policy excerpt',
  null,
  'text/plain',
  null,
  'ready',
  'radar-demo-pricing-document-v1',
  220,
  '2026-07-03 09:11:00+00',
  null,
  '{"demo": true, "sourceKind": "manual_text"}'::jsonb,
  '2026-07-03 09:11:00+00',
  '2026-07-03 09:11:00+00'
)
on conflict (id) do update
set
  workspace_id = excluded.workspace_id,
  source_id = excluded.source_id,
  source_version_id = excluded.source_version_id,
  title = excluded.title,
  document_uri = excluded.document_uri,
  mime_type = excluded.mime_type,
  storage_path = excluded.storage_path,
  status = excluded.status,
  content_hash = excluded.content_hash,
  byte_size = excluded.byte_size,
  extracted_at = excluded.extracted_at,
  extraction_error = excluded.extraction_error,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.source_chunks (
  id,
  workspace_id,
  source_id,
  source_document_id,
  chunk_index,
  content,
  content_hash,
  token_count,
  embedding,
  metadata,
  created_at
)
values (
  '43000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  '42000000-0000-4000-8000-000000000001',
  0,
  'Synthetic pricing policy: support answers must match the current plan limits and route billing exceptions to a human owner.',
  'radar-demo-pricing-chunk-v1',
  19,
  null,
  '{"demo": true, "section": "pricing"}'::jsonb,
  '2026-07-03 09:11:00+00'
)
on conflict (id) do update
set
  workspace_id = excluded.workspace_id,
  source_id = excluded.source_id,
  source_document_id = excluded.source_document_id,
  chunk_index = excluded.chunk_index,
  content = excluded.content,
  content_hash = excluded.content_hash,
  token_count = excluded.token_count,
  embedding = excluded.embedding,
  metadata = excluded.metadata,
  created_at = excluded.created_at;

insert into public.assertions (
  id,
  workspace_id,
  title,
  purpose,
  expected_behavior,
  category,
  priority,
  runner_type,
  status,
  owner_user_id,
  created_by,
  metadata,
  created_at,
  updated_at
)
values (
  '50000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  'Pricing answers match the pricing policy',
  'Verify that customer-facing pricing answers stay aligned with the current pricing policy source.',
  'Support answers must quote current plan limits and route billing exceptions to a human owner.',
  'pricing',
  'high',
  'knowledge',
  'active',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000001',
  '{"demo": true, "businessRisk": "customers receive outdated plan limits"}'::jsonb,
  '2026-07-03 09:15:00+00',
  '2026-07-03 09:15:00+00'
)
on conflict (id) do update
set
  workspace_id = excluded.workspace_id,
  title = excluded.title,
  purpose = excluded.purpose,
  expected_behavior = excluded.expected_behavior,
  category = excluded.category,
  priority = excluded.priority,
  runner_type = excluded.runner_type,
  status = excluded.status,
  owner_user_id = excluded.owner_user_id,
  created_by = excluded.created_by,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.assertion_sources (
  workspace_id,
  assertion_id,
  source_id,
  is_required,
  purpose,
  created_at
)
values (
  '20000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  true,
  'Pricing policy source required for knowledge runner grounding.',
  '2026-07-03 09:16:00+00'
)
on conflict (assertion_id, source_id) do update
set
  workspace_id = excluded.workspace_id,
  is_required = excluded.is_required,
  purpose = excluded.purpose;

insert into public.assertion_runs_schedule (
  id,
  workspace_id,
  assertion_id,
  cadence,
  timezone,
  source_change_trigger,
  is_enabled,
  next_run_at,
  last_scheduled_at,
  metadata,
  created_at,
  updated_at
)
values (
  '51000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001',
  'daily',
  'UTC',
  true,
  true,
  '2026-07-04 09:00:00+00',
  '2026-07-03 09:17:00+00',
  '{"demo": true, "reason": "daily-pricing-confidence"}'::jsonb,
  '2026-07-03 09:17:00+00',
  '2026-07-03 09:17:00+00'
)
on conflict (id) do update
set
  workspace_id = excluded.workspace_id,
  assertion_id = excluded.assertion_id,
  cadence = excluded.cadence,
  timezone = excluded.timezone,
  source_change_trigger = excluded.source_change_trigger,
  is_enabled = excluded.is_enabled,
  next_run_at = excluded.next_run_at,
  last_scheduled_at = excluded.last_scheduled_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.test_cases (
  id,
  workspace_id,
  assertion_id,
  title,
  type,
  status,
  input,
  expected_result,
  ordinal,
  created_by,
  approved_by,
  approved_at,
  metadata,
  created_at,
  updated_at
)
values (
  '52000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001',
  'Customer asks about current plan limits',
  'customer_question',
  'approved',
  '{"question": "What plan limit applies to my account today?"}'::jsonb,
  'The answer should match the pricing policy source and avoid outdated plan limits.',
  0,
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '2026-07-03 09:18:00+00',
  '{"demo": true, "runnerType": "knowledge"}'::jsonb,
  '2026-07-03 09:18:00+00',
  '2026-07-03 09:18:00+00'
)
on conflict (id) do update
set
  workspace_id = excluded.workspace_id,
  assertion_id = excluded.assertion_id,
  title = excluded.title,
  type = excluded.type,
  status = excluded.status,
  input = excluded.input,
  expected_result = excluded.expected_result,
  ordinal = excluded.ordinal,
  created_by = excluded.created_by,
  approved_by = excluded.approved_by,
  approved_at = excluded.approved_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.assertion_templates (
  id,
  workspace_id,
  name,
  description,
  category,
  priority,
  runner_type,
  purpose_template,
  expected_behavior_template,
  required_source_types,
  test_case_blueprints,
  is_system,
  metadata,
  created_at,
  updated_at
)
values (
  '53000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  'Pricing accuracy assertion',
  'Local template for verifying customer-facing pricing answers against approved sources.',
  'pricing',
  'high',
  'knowledge',
  'Verify pricing answers against the current policy source.',
  'Answers must match the approved source and escalate billing exceptions.',
  array['manual_text']::public.source_type[],
  '[{"type": "customer_question", "title": "Customer asks about plan limits"}]'::jsonb,
  false,
  '{"demo": true}'::jsonb,
  '2026-07-03 09:19:00+00',
  '2026-07-03 09:19:00+00'
)
on conflict (id) do update
set
  workspace_id = excluded.workspace_id,
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  priority = excluded.priority,
  runner_type = excluded.runner_type,
  purpose_template = excluded.purpose_template,
  expected_behavior_template = excluded.expected_behavior_template,
  required_source_types = excluded.required_source_types,
  test_case_blueprints = excluded.test_case_blueprints,
  is_system = excluded.is_system,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.evaluation_runs (
  id,
  workspace_id,
  assertion_id,
  runner_type,
  status,
  trigger_type,
  triggered_by_user_id,
  scheduled_for,
  started_at,
  completed_at,
  duration_ms,
  total_test_cases,
  passed_count,
  warning_count,
  failed_count,
  error_count,
  skipped_count,
  score,
  confidence,
  evidence_refs,
  execution_metadata,
  error_message,
  created_at,
  updated_at
)
values (
  '60000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001',
  'knowledge',
  'failed',
  'source_change',
  '10000000-0000-4000-8000-000000000002',
  '2026-07-03 09:20:00+00',
  '2026-07-03 09:20:05+00',
  '2026-07-03 09:20:09+00',
  4000,
  1,
  0,
  0,
  1,
  0,
  0,
  0.6200,
  0.8800,
  '[{"sourceId": "40000000-0000-4000-8000-000000000001", "sourceDocumentId": "42000000-0000-4000-8000-000000000001", "sourceChunkId": "43000000-0000-4000-8000-000000000001", "citation": "Synthetic pricing policy excerpt", "score": 0.94}]'::jsonb,
  '{"demo": true, "runner": "knowledge", "reason": "source-change"}'::jsonb,
  null,
  '2026-07-03 09:20:00+00',
  '2026-07-03 09:20:09+00'
)
on conflict (id) do update
set
  workspace_id = excluded.workspace_id,
  assertion_id = excluded.assertion_id,
  runner_type = excluded.runner_type,
  status = excluded.status,
  trigger_type = excluded.trigger_type,
  triggered_by_user_id = excluded.triggered_by_user_id,
  scheduled_for = excluded.scheduled_for,
  started_at = excluded.started_at,
  completed_at = excluded.completed_at,
  duration_ms = excluded.duration_ms,
  total_test_cases = excluded.total_test_cases,
  passed_count = excluded.passed_count,
  warning_count = excluded.warning_count,
  failed_count = excluded.failed_count,
  error_count = excluded.error_count,
  skipped_count = excluded.skipped_count,
  score = excluded.score,
  confidence = excluded.confidence,
  evidence_refs = excluded.evidence_refs,
  execution_metadata = excluded.execution_metadata,
  error_message = excluded.error_message,
  updated_at = excluded.updated_at;

insert into public.test_case_results (
  id,
  workspace_id,
  evaluation_run_id,
  assertion_id,
  test_case_id,
  runner_type,
  status,
  score,
  confidence,
  actual_output,
  actual_summary,
  evaluator_summary,
  evidence_refs,
  execution_metadata,
  error_message,
  started_at,
  completed_at,
  duration_ms,
  created_at,
  updated_at
)
values (
  '61000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '60000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001',
  '52000000-0000-4000-8000-000000000001',
  'knowledge',
  'failed',
  0.6200,
  0.8800,
  '{"answer": "The assistant referenced the previous plan limit instead of the current policy.", "redacted": true}'::jsonb,
  'The synthetic answer referenced an outdated plan limit.',
  'Expected current policy wording, but actual output cited the previous limit.',
  '[{"sourceId": "40000000-0000-4000-8000-000000000001", "sourceDocumentId": "42000000-0000-4000-8000-000000000001", "sourceChunkId": "43000000-0000-4000-8000-000000000001", "citation": "Synthetic pricing policy excerpt", "score": 0.94}]'::jsonb,
  '{"demo": true, "evaluator": "synthetic-local"}'::jsonb,
  null,
  '2026-07-03 09:20:05+00',
  '2026-07-03 09:20:09+00',
  4000,
  '2026-07-03 09:20:09+00',
  '2026-07-03 09:20:09+00'
)
on conflict (id) do update
set
  workspace_id = excluded.workspace_id,
  evaluation_run_id = excluded.evaluation_run_id,
  assertion_id = excluded.assertion_id,
  test_case_id = excluded.test_case_id,
  runner_type = excluded.runner_type,
  status = excluded.status,
  score = excluded.score,
  confidence = excluded.confidence,
  actual_output = excluded.actual_output,
  actual_summary = excluded.actual_summary,
  evaluator_summary = excluded.evaluator_summary,
  evidence_refs = excluded.evidence_refs,
  execution_metadata = excluded.execution_metadata,
  error_message = excluded.error_message,
  started_at = excluded.started_at,
  completed_at = excluded.completed_at,
  duration_ms = excluded.duration_ms,
  updated_at = excluded.updated_at;

insert into public.audit_logs (
  id,
  workspace_id,
  actor_user_id,
  action,
  resource_type,
  resource_id,
  metadata,
  created_at
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'workspace.created',
    'workspace',
    '20000000-0000-4000-8000-000000000001',
    '{"demo": true, "slug": "radar-demo-workspace"}'::jsonb,
    '2026-07-03 09:05:00+00'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'source.created',
    'source',
    '40000000-0000-4000-8000-000000000001',
    '{"demo": true, "sampleTitle": "Pricing policy source", "sourceType": "manual_text", "usedByAssertions": ["50000000-0000-4000-8000-000000000001"]}'::jsonb,
    '2026-07-03 09:10:00+00'
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    'assertion.created',
    'assertion',
    '50000000-0000-4000-8000-000000000001',
    '{"demo": true, "sampleTitle": "Pricing answers match the pricing page", "runnerType": "knowledge", "priority": "high", "requiredSourceIds": ["40000000-0000-4000-8000-000000000001"]}'::jsonb,
    '2026-07-03 09:15:00+00'
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    'run.rerun_requested',
    'run',
    '60000000-0000-4000-8000-000000000001',
    '{"demo": true, "assertionId": "50000000-0000-4000-8000-000000000001", "runnerType": "knowledge", "reason": "source-change"}'::jsonb,
    '2026-07-03 09:20:00+00'
  ),
  (
    '30000000-0000-4000-8000-000000000005',
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    'finding.updated',
    'finding',
    '70000000-0000-4000-8000-000000000001',
    '{"demo": true, "sampleTitle": "AI support quoted an outdated plan limit", "assertionId": "50000000-0000-4000-8000-000000000001", "severity": "critical", "confidence": 0.88, "expected": "Pricing answer matches the current pricing page.", "actual": "Support answer referenced the previous plan limit.", "recommendedFix": "Update support knowledge and rerun the pricing assertion."}'::jsonb,
    '2026-07-03 09:25:00+00'
  )
on conflict (id) do update
set
  workspace_id = excluded.workspace_id,
  actor_user_id = excluded.actor_user_id,
  action = excluded.action,
  resource_type = excluded.resource_type,
  resource_id = excluded.resource_id,
  metadata = excluded.metadata,
  created_at = excluded.created_at;

commit;

-- RAD-019 deterministic local/test seed.
-- This file may run only through the local Supabase seed entrypoint.
-- It intentionally seeds only schemas that exist in Phase 1:
-- auth.users, workspaces, workspace_members, and audit_logs.

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
    '{"demo": true, "sampleTitle": "Pricing page source", "sourceType": "url", "usedByAssertions": ["50000000-0000-4000-8000-000000000001"]}'::jsonb,
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

create type public.assertion_status as enum (
  'draft',
  'active',
  'paused',
  'archived'
);

create type public.assertion_priority as enum (
  'critical',
  'high',
  'medium',
  'low'
);

create type public.assertion_category as enum (
  'pricing',
  'refund_cancellation',
  'trial_onboarding',
  'billing_invoices',
  'support_escalation',
  'custom'
);

create type public.runner_type as enum (
  'knowledge',
  'journey',
  'integration'
);

create type public.test_case_status as enum (
  'draft',
  'approved',
  'disabled',
  'archived'
);

create type public.test_case_type as enum (
  'customer_question',
  'journey_scenario',
  'integration_check'
);

create type public.assertion_schedule_cadence as enum (
  'manual',
  'hourly',
  'daily',
  'weekly',
  'monthly'
);

create table public.assertions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  purpose text not null,
  expected_behavior text not null,
  category public.assertion_category not null,
  priority public.assertion_priority not null default 'medium',
  runner_type public.runner_type not null,
  status public.assertion_status not null default 'draft',
  owner_user_id uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assertions_title_length check (char_length(trim(title)) between 4 and 180),
  constraint assertions_purpose_length check (char_length(trim(purpose)) between 8 and 1000),
  constraint assertions_expected_behavior_length check (char_length(trim(expected_behavior)) between 8 and 2000),
  constraint assertions_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.assertion_sources (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  assertion_id uuid not null references public.assertions(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete cascade,
  is_required boolean not null default true,
  purpose text,
  created_at timestamptz not null default now(),
  constraint assertion_sources_purpose_length check (purpose is null or char_length(purpose) <= 500),
  primary key (assertion_id, source_id)
);

create table public.assertion_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  description text not null,
  category public.assertion_category not null,
  priority public.assertion_priority not null default 'medium',
  runner_type public.runner_type not null,
  purpose_template text not null,
  expected_behavior_template text not null,
  required_source_types public.source_type[] not null default '{}'::public.source_type[],
  test_case_blueprints jsonb not null default '[]'::jsonb,
  is_system boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assertion_templates_name_length check (char_length(trim(name)) between 4 and 140),
  constraint assertion_templates_description_length check (char_length(trim(description)) between 8 and 500),
  constraint assertion_templates_blueprints_array check (jsonb_typeof(test_case_blueprints) = 'array'),
  constraint assertion_templates_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint assertion_templates_system_workspace_check check (
    (is_system = true and workspace_id is null)
    or (is_system = false and workspace_id is not null)
  )
);

create table public.assertion_runs_schedule (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  assertion_id uuid not null references public.assertions(id) on delete cascade,
  cadence public.assertion_schedule_cadence not null default 'manual',
  timezone text not null default 'UTC',
  source_change_trigger boolean not null default true,
  is_enabled boolean not null default false,
  next_run_at timestamptz,
  last_scheduled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assertion_runs_schedule_timezone_length check (char_length(trim(timezone)) between 1 and 80),
  constraint assertion_runs_schedule_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint assertion_runs_schedule_assertion_unique unique (assertion_id)
);

create table public.test_cases (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  assertion_id uuid not null references public.assertions(id) on delete cascade,
  title text not null,
  type public.test_case_type not null,
  status public.test_case_status not null default 'draft',
  input jsonb not null default '{}'::jsonb,
  expected_result text not null,
  ordinal integer not null default 0,
  created_by uuid not null references auth.users(id) on delete restrict,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint test_cases_title_length check (char_length(trim(title)) between 4 and 180),
  constraint test_cases_expected_result_length check (char_length(trim(expected_result)) between 8 and 2000),
  constraint test_cases_ordinal_non_negative check (ordinal >= 0),
  constraint test_cases_input_object check (jsonb_typeof(input) = 'object'),
  constraint test_cases_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint test_cases_approval_check check (
    (status = 'approved' and approved_by is not null and approved_at is not null)
    or status <> 'approved'
  )
);

create index assertions_workspace_status_idx on public.assertions(workspace_id, status);
create index assertions_workspace_category_idx on public.assertions(workspace_id, category);
create index assertions_workspace_runner_idx on public.assertions(workspace_id, runner_type);
create index assertions_owner_idx on public.assertions(owner_user_id);
create index assertion_sources_workspace_source_idx on public.assertion_sources(workspace_id, source_id);
create index assertion_templates_workspace_idx on public.assertion_templates(workspace_id, category);
create index assertion_runs_schedule_workspace_idx on public.assertion_runs_schedule(workspace_id, cadence, is_enabled);
create index test_cases_workspace_assertion_idx on public.test_cases(workspace_id, assertion_id, ordinal);
create index test_cases_status_idx on public.test_cases(workspace_id, status);

create trigger assertions_set_updated_at
before update on public.assertions
for each row execute function public.set_updated_at();

create trigger assertion_templates_set_updated_at
before update on public.assertion_templates
for each row execute function public.set_updated_at();

create trigger assertion_runs_schedule_set_updated_at
before update on public.assertion_runs_schedule
for each row execute function public.set_updated_at();

create trigger test_cases_set_updated_at
before update on public.test_cases
for each row execute function public.set_updated_at();

alter table public.assertions enable row level security;
alter table public.assertion_sources enable row level security;
alter table public.assertion_templates enable row level security;
alter table public.assertion_runs_schedule enable row level security;
alter table public.test_cases enable row level security;

create policy "workspace members can read assertions"
on public.assertions
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = assertions.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

create policy "workspace editors can create assertions"
on public.assertions
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = assertions.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
);

create policy "workspace editors can update assertions"
on public.assertions
for update
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = assertions.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = assertions.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
);

create policy "workspace admins can delete assertions"
on public.assertions
for delete
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = assertions.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role = 'admin'
  )
);

create policy "workspace members can read assertion sources"
on public.assertion_sources
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = assertion_sources.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

create policy "workspace editors can manage assertion sources"
on public.assertion_sources
for all
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = assertion_sources.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = assertion_sources.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
);

create policy "workspace members can read assertion templates"
on public.assertion_templates
for select
to authenticated
using (
  is_system = true
  or exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = assertion_templates.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

create policy "workspace editors can manage workspace assertion templates"
on public.assertion_templates
for all
to authenticated
using (
  is_system = false
  and exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = assertion_templates.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
)
with check (
  is_system = false
  and exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = assertion_templates.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
);

create policy "workspace members can read assertion schedules"
on public.assertion_runs_schedule
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = assertion_runs_schedule.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

create policy "workspace editors can manage assertion schedules"
on public.assertion_runs_schedule
for all
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = assertion_runs_schedule.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = assertion_runs_schedule.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
);

create policy "workspace members can read test cases"
on public.test_cases
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = test_cases.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

create policy "workspace editors can manage test cases"
on public.test_cases
for all
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = test_cases.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = test_cases.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
);

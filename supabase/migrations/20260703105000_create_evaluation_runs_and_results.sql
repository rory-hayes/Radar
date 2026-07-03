create type public.evaluation_run_status as enum (
  'queued',
  'running',
  'passed',
  'warning',
  'failed',
  'inconclusive',
  'error',
  'canceled'
);

create type public.test_case_result_status as enum (
  'passed',
  'warning',
  'failed',
  'inconclusive',
  'error',
  'skipped'
);

create type public.evaluation_run_trigger as enum (
  'manual',
  'schedule',
  'source_change',
  'system'
);

alter table public.assertions
add constraint assertions_workspace_id_id_unique unique (workspace_id, id);

alter table public.test_cases
add constraint test_cases_workspace_id_id_unique unique (workspace_id, id);

create table public.evaluation_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  assertion_id uuid not null,
  runner_type public.runner_type not null,
  status public.evaluation_run_status not null default 'queued',
  trigger_type public.evaluation_run_trigger not null default 'manual',
  triggered_by_user_id uuid references auth.users(id) on delete set null,
  scheduled_for timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  total_test_cases integer not null default 0,
  passed_count integer not null default 0,
  warning_count integer not null default 0,
  failed_count integer not null default 0,
  error_count integer not null default 0,
  skipped_count integer not null default 0,
  score numeric(5, 4),
  confidence numeric(5, 4),
  evidence_refs jsonb not null default '[]'::jsonb,
  execution_metadata jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint evaluation_runs_workspace_assertion_fk foreign key (workspace_id, assertion_id)
    references public.assertions(workspace_id, id) on delete cascade,
  constraint evaluation_runs_duration_non_negative check (duration_ms is null or duration_ms >= 0),
  constraint evaluation_runs_counts_non_negative check (
    total_test_cases >= 0
    and passed_count >= 0
    and warning_count >= 0
    and failed_count >= 0
    and error_count >= 0
    and skipped_count >= 0
  ),
  constraint evaluation_runs_score_range check (score is null or (score >= 0 and score <= 1)),
  constraint evaluation_runs_confidence_range check (confidence is null or (confidence >= 0 and confidence <= 1)),
  constraint evaluation_runs_evidence_refs_array check (jsonb_typeof(evidence_refs) = 'array'),
  constraint evaluation_runs_execution_metadata_object check (jsonb_typeof(execution_metadata) = 'object'),
  constraint evaluation_runs_error_message_length check (error_message is null or char_length(error_message) <= 2000),
  constraint evaluation_runs_workspace_id_id_unique unique (workspace_id, id),
  constraint evaluation_runs_completed_after_started check (
    completed_at is null
    or started_at is null
    or completed_at >= started_at
  )
);

create table public.test_case_results (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  evaluation_run_id uuid not null,
  assertion_id uuid not null,
  test_case_id uuid not null,
  runner_type public.runner_type not null,
  status public.test_case_result_status not null default 'inconclusive',
  score numeric(5, 4),
  confidence numeric(5, 4),
  actual_output jsonb not null default '{}'::jsonb,
  actual_summary text,
  evaluator_summary text,
  evidence_refs jsonb not null default '[]'::jsonb,
  execution_metadata jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint test_case_results_workspace_run_fk foreign key (workspace_id, evaluation_run_id)
    references public.evaluation_runs(workspace_id, id) on delete cascade,
  constraint test_case_results_workspace_assertion_fk foreign key (workspace_id, assertion_id)
    references public.assertions(workspace_id, id) on delete cascade,
  constraint test_case_results_workspace_test_case_fk foreign key (workspace_id, test_case_id)
    references public.test_cases(workspace_id, id) on delete cascade,
  constraint test_case_results_run_case_unique unique (evaluation_run_id, test_case_id),
  constraint test_case_results_score_range check (score is null or (score >= 0 and score <= 1)),
  constraint test_case_results_confidence_range check (confidence is null or (confidence >= 0 and confidence <= 1)),
  constraint test_case_results_actual_output_object check (jsonb_typeof(actual_output) = 'object'),
  constraint test_case_results_evidence_refs_array check (jsonb_typeof(evidence_refs) = 'array'),
  constraint test_case_results_execution_metadata_object check (jsonb_typeof(execution_metadata) = 'object'),
  constraint test_case_results_actual_summary_length check (actual_summary is null or char_length(actual_summary) <= 2000),
  constraint test_case_results_evaluator_summary_length check (evaluator_summary is null or char_length(evaluator_summary) <= 2000),
  constraint test_case_results_error_message_length check (error_message is null or char_length(error_message) <= 2000),
  constraint test_case_results_duration_non_negative check (duration_ms is null or duration_ms >= 0),
  constraint test_case_results_completed_after_started check (
    completed_at is null
    or started_at is null
    or completed_at >= started_at
  )
);

create index evaluation_runs_workspace_status_idx on public.evaluation_runs(workspace_id, status, created_at desc);
create index evaluation_runs_workspace_assertion_idx on public.evaluation_runs(workspace_id, assertion_id, created_at desc);
create index evaluation_runs_workspace_runner_idx on public.evaluation_runs(workspace_id, runner_type, created_at desc);
create index evaluation_runs_triggered_by_idx on public.evaluation_runs(triggered_by_user_id);
create index test_case_results_workspace_run_idx on public.test_case_results(workspace_id, evaluation_run_id);
create index test_case_results_workspace_assertion_idx on public.test_case_results(workspace_id, assertion_id);
create index test_case_results_workspace_status_idx on public.test_case_results(workspace_id, status);

create trigger evaluation_runs_set_updated_at
before update on public.evaluation_runs
for each row execute function public.set_updated_at();

create trigger test_case_results_set_updated_at
before update on public.test_case_results
for each row execute function public.set_updated_at();

alter table public.evaluation_runs enable row level security;
alter table public.test_case_results enable row level security;

create policy "workspace members can read evaluation runs"
on public.evaluation_runs
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = evaluation_runs.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

create policy "workspace editors can create evaluation runs"
on public.evaluation_runs
for insert
to authenticated
with check (
  triggered_by_user_id = auth.uid()
  and exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = evaluation_runs.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
);

create policy "workspace editors can update evaluation runs"
on public.evaluation_runs
for update
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = evaluation_runs.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = evaluation_runs.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
);

create policy "workspace admins can delete evaluation runs"
on public.evaluation_runs
for delete
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = evaluation_runs.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role = 'admin'
  )
);

create policy "workspace members can read test case results"
on public.test_case_results
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = test_case_results.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

create policy "workspace editors can create test case results"
on public.test_case_results
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = test_case_results.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
);

create policy "workspace editors can update test case results"
on public.test_case_results
for update
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = test_case_results.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = test_case_results.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
);

create policy "workspace admins can delete test case results"
on public.test_case_results
for delete
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = test_case_results.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role = 'admin'
  )
);

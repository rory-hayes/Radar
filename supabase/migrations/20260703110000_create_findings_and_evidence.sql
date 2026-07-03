create type public.finding_status as enum (
  'open',
  'investigating',
  'fixed',
  'resolved',
  'ignored',
  'false_positive'
);

create type public.finding_severity as enum (
  'critical',
  'high',
  'medium',
  'low'
);

create type public.finding_evidence_type as enum (
  'source_chunk',
  'source_document',
  'run_output',
  'artifact',
  'manual_note'
);

create type public.finding_activity_type as enum (
  'created',
  'status_changed',
  'assigned',
  'unassigned',
  'commented',
  'evidence_added',
  'rerun_linked',
  'resolved'
);

alter table public.sources
add constraint sources_workspace_id_id_unique unique (workspace_id, id);

alter table public.source_documents
add constraint source_documents_workspace_id_id_unique unique (workspace_id, id);

alter table public.source_chunks
add constraint source_chunks_workspace_id_id_unique unique (workspace_id, id);

alter table public.test_case_results
add constraint test_case_results_workspace_id_id_unique unique (workspace_id, id);

create table public.findings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  assertion_id uuid not null,
  evaluation_run_id uuid,
  test_case_result_id uuid,
  title text not null,
  summary text not null,
  expected text not null,
  actual text not null,
  severity public.finding_severity not null default 'medium',
  status public.finding_status not null default 'open',
  confidence numeric(5, 4) not null,
  customer_impact text not null,
  recommended_fix text not null,
  owner_user_id uuid references auth.users(id) on delete set null,
  dedupe_key text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by_user_id uuid references auth.users(id) on delete set null,
  resolution_summary text,
  ignored_until timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint findings_workspace_assertion_fk foreign key (workspace_id, assertion_id)
    references public.assertions(workspace_id, id) on delete cascade,
  constraint findings_workspace_run_fk foreign key (workspace_id, evaluation_run_id)
    references public.evaluation_runs(workspace_id, id) on delete cascade,
  constraint findings_workspace_result_fk foreign key (workspace_id, test_case_result_id)
    references public.test_case_results(workspace_id, id) on delete cascade,
  constraint findings_title_length check (char_length(trim(title)) between 4 and 180),
  constraint findings_summary_length check (char_length(trim(summary)) between 8 and 2000),
  constraint findings_expected_length check (char_length(trim(expected)) between 4 and 2000),
  constraint findings_actual_length check (char_length(trim(actual)) between 4 and 2000),
  constraint findings_customer_impact_length check (char_length(trim(customer_impact)) between 8 and 2000),
  constraint findings_recommended_fix_length check (char_length(trim(recommended_fix)) between 8 and 2000),
  constraint findings_confidence_range check (confidence >= 0 and confidence <= 1),
  constraint findings_dedupe_key_length check (char_length(trim(dedupe_key)) between 8 and 240),
  constraint findings_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint findings_resolution_check check (
    (
      status in ('resolved', 'false_positive')
      and resolved_at is not null
      and resolved_by_user_id is not null
      and resolution_summary is not null
    )
    or status not in ('resolved', 'false_positive')
  ),
  constraint findings_seen_order_check check (last_seen_at >= first_seen_at),
  constraint findings_workspace_id_id_unique unique (workspace_id, id),
  constraint findings_workspace_dedupe_unique unique (workspace_id, dedupe_key)
);

create table public.finding_evidence (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  finding_id uuid not null,
  evidence_type public.finding_evidence_type not null,
  source_id uuid,
  source_document_id uuid,
  source_chunk_id uuid,
  evaluation_run_id uuid,
  test_case_result_id uuid,
  quote text,
  artifact_path text,
  citation text,
  confidence numeric(5, 4),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint finding_evidence_workspace_finding_fk foreign key (workspace_id, finding_id)
    references public.findings(workspace_id, id) on delete cascade,
  constraint finding_evidence_workspace_source_fk foreign key (workspace_id, source_id)
    references public.sources(workspace_id, id) on delete cascade,
  constraint finding_evidence_workspace_document_fk foreign key (workspace_id, source_document_id)
    references public.source_documents(workspace_id, id) on delete cascade,
  constraint finding_evidence_workspace_chunk_fk foreign key (workspace_id, source_chunk_id)
    references public.source_chunks(workspace_id, id) on delete cascade,
  constraint finding_evidence_workspace_run_fk foreign key (workspace_id, evaluation_run_id)
    references public.evaluation_runs(workspace_id, id) on delete cascade,
  constraint finding_evidence_workspace_result_fk foreign key (workspace_id, test_case_result_id)
    references public.test_case_results(workspace_id, id) on delete cascade,
  constraint finding_evidence_quote_length check (quote is null or char_length(quote) <= 2000),
  constraint finding_evidence_artifact_path_length check (artifact_path is null or char_length(artifact_path) <= 1024),
  constraint finding_evidence_citation_length check (citation is null or char_length(citation) <= 500),
  constraint finding_evidence_confidence_range check (confidence is null or (confidence >= 0 and confidence <= 1)),
  constraint finding_evidence_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.finding_assignments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  finding_id uuid not null,
  assignee_user_id uuid not null references auth.users(id) on delete cascade,
  assigned_by_user_id uuid references auth.users(id) on delete set null,
  note text,
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint finding_assignments_workspace_finding_fk foreign key (workspace_id, finding_id)
    references public.findings(workspace_id, id) on delete cascade,
  constraint finding_assignments_note_length check (note is null or char_length(note) <= 1000),
  constraint finding_assignments_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint finding_assignments_unassigned_after_assigned check (
    unassigned_at is null
    or unassigned_at >= assigned_at
  )
);

create table public.finding_activity (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  finding_id uuid not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  activity_type public.finding_activity_type not null,
  from_status public.finding_status,
  to_status public.finding_status,
  from_assignee_user_id uuid references auth.users(id) on delete set null,
  to_assignee_user_id uuid references auth.users(id) on delete set null,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint finding_activity_workspace_finding_fk foreign key (workspace_id, finding_id)
    references public.findings(workspace_id, id) on delete cascade,
  constraint finding_activity_note_length check (note is null or char_length(note) <= 2000),
  constraint finding_activity_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint finding_activity_status_change_check check (
    activity_type <> 'status_changed'
    or (from_status is not null and to_status is not null and from_status <> to_status)
  )
);

create index findings_workspace_status_idx on public.findings(workspace_id, status, severity);
create index findings_workspace_assertion_idx on public.findings(workspace_id, assertion_id, last_seen_at desc);
create index findings_workspace_owner_idx on public.findings(workspace_id, owner_user_id);
create index finding_evidence_workspace_finding_idx on public.finding_evidence(workspace_id, finding_id);
create index finding_evidence_workspace_source_idx on public.finding_evidence(workspace_id, source_id);
create index finding_assignments_workspace_finding_idx on public.finding_assignments(workspace_id, finding_id);
create unique index finding_assignments_active_unique_idx
on public.finding_assignments(finding_id, assignee_user_id)
where unassigned_at is null;
create index finding_activity_workspace_finding_idx on public.finding_activity(workspace_id, finding_id, created_at desc);

create trigger findings_set_updated_at
before update on public.findings
for each row execute function public.set_updated_at();

alter table public.findings enable row level security;
alter table public.finding_evidence enable row level security;
alter table public.finding_assignments enable row level security;
alter table public.finding_activity enable row level security;

create policy "workspace members can read findings"
on public.findings
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = findings.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

create policy "workspace editors can create findings"
on public.findings
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = findings.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
);

create policy "workspace editors can update findings"
on public.findings
for update
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = findings.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = findings.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
);

create policy "workspace admins can delete findings"
on public.findings
for delete
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = findings.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role = 'admin'
  )
);

create policy "workspace members can read finding evidence"
on public.finding_evidence
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = finding_evidence.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

create policy "workspace editors can manage finding evidence"
on public.finding_evidence
for all
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = finding_evidence.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = finding_evidence.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
);

create policy "workspace members can read finding assignments"
on public.finding_assignments
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = finding_assignments.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

create policy "workspace editors can manage finding assignments"
on public.finding_assignments
for all
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = finding_assignments.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = finding_assignments.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
);

create policy "workspace members can read finding activity"
on public.finding_activity
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = finding_activity.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

create policy "workspace editors can create finding activity"
on public.finding_activity
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = finding_activity.workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('admin', 'editor')
  )
);

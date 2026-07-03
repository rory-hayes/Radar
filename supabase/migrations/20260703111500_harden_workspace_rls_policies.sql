create or replace function public.current_user_has_workspace_role(
  target_workspace_id uuid,
  allowed_roles public.workspace_member_role[]
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select target_workspace_id is not null
    and auth.uid() is not null
    and exists (
      select 1
      from public.workspace_members membership
      where membership.workspace_id = target_workspace_id
        and membership.user_id = auth.uid()
        and membership.status = 'active'
        and membership.role = any(allowed_roles)
    );
$$;

create or replace function public.current_user_is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_user_has_workspace_role(
    target_workspace_id,
    array[
      'admin'::public.workspace_member_role,
      'editor'::public.workspace_member_role,
      'viewer'::public.workspace_member_role
    ]
  );
$$;

create or replace function public.current_user_can_edit_workspace(target_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_user_has_workspace_role(
    target_workspace_id,
    array['admin'::public.workspace_member_role, 'editor'::public.workspace_member_role]
  );
$$;

create or replace function public.current_user_is_workspace_admin(target_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_user_has_workspace_role(
    target_workspace_id,
    array['admin'::public.workspace_member_role]
  );
$$;

create or replace function public.storage_object_workspace_id(object_name text)
returns uuid
language plpgsql
immutable
as $$
declare
  workspace_id_text text;
begin
  workspace_id_text := split_part(coalesce(object_name, ''), '/', 1);

  if workspace_id_text = '' then
    return null;
  end if;

  return workspace_id_text::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

revoke all on function public.current_user_has_workspace_role(uuid, public.workspace_member_role[]) from public;
revoke all on function public.current_user_is_workspace_member(uuid) from public;
revoke all on function public.current_user_can_edit_workspace(uuid) from public;
revoke all on function public.current_user_is_workspace_admin(uuid) from public;
revoke all on function public.storage_object_workspace_id(text) from public;

grant execute on function public.current_user_has_workspace_role(uuid, public.workspace_member_role[]) to authenticated;
grant execute on function public.current_user_is_workspace_member(uuid) to authenticated;
grant execute on function public.current_user_can_edit_workspace(uuid) to authenticated;
grant execute on function public.current_user_is_workspace_admin(uuid) to authenticated;
grant execute on function public.storage_object_workspace_id(text) to authenticated;

alter table public.workspaces force row level security;
alter table public.workspace_members force row level security;
alter table public.audit_logs force row level security;
alter table public.sources force row level security;
alter table public.source_versions force row level security;
alter table public.source_documents force row level security;
alter table public.source_chunks force row level security;
alter table public.assertions force row level security;
alter table public.assertion_sources force row level security;
alter table public.assertion_templates force row level security;
alter table public.assertion_runs_schedule force row level security;
alter table public.test_cases force row level security;
alter table public.evaluation_runs force row level security;
alter table public.test_case_results force row level security;
alter table public.findings force row level security;
alter table public.finding_evidence force row level security;
alter table public.finding_assignments force row level security;
alter table public.finding_activity force row level security;

drop policy if exists "workspace members can read their workspaces" on public.workspaces;
drop policy if exists "authenticated users can create owned workspaces" on public.workspaces;
drop policy if exists "workspace admins can update workspace profile" on public.workspaces;

create policy "workspace members can read their workspaces"
on public.workspaces
for select
to authenticated
using (
  created_by = auth.uid()
  or public.current_user_is_workspace_member(workspaces.id)
);

create policy "authenticated users can create owned workspaces"
on public.workspaces
for insert
to authenticated
with check (created_by = auth.uid());

create policy "workspace admins can update workspace profile"
on public.workspaces
for update
to authenticated
using (public.current_user_is_workspace_admin(workspaces.id))
with check (public.current_user_is_workspace_admin(workspaces.id));

drop policy if exists "workspace members can read active memberships" on public.workspace_members;
drop policy if exists "workspace creators can add themselves as admin" on public.workspace_members;
drop policy if exists "workspace admins can update memberships" on public.workspace_members;
drop policy if exists "workspace admins can remove memberships" on public.workspace_members;

create policy "workspace members can read active memberships"
on public.workspace_members
for select
to authenticated
using (public.current_user_is_workspace_member(workspace_members.workspace_id));

create policy "workspace creators can add themselves as admin"
on public.workspace_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  and role = 'admin'
  and status = 'active'
  and exists (
    select 1
    from public.workspaces workspace
    where workspace.id = workspace_members.workspace_id
      and workspace.created_by = auth.uid()
  )
);

create policy "workspace admins can update memberships"
on public.workspace_members
for update
to authenticated
using (public.current_user_is_workspace_admin(workspace_members.workspace_id))
with check (public.current_user_is_workspace_admin(workspace_members.workspace_id));

create policy "workspace admins can remove memberships"
on public.workspace_members
for delete
to authenticated
using (public.current_user_is_workspace_admin(workspace_members.workspace_id));

drop policy if exists "workspace members can read workspace audit logs" on public.audit_logs;
drop policy if exists "actors can read their own auth audit logs" on public.audit_logs;
drop policy if exists "authenticated users can write scoped audit logs" on public.audit_logs;

create policy "workspace members can read workspace audit logs"
on public.audit_logs
for select
to authenticated
using (
  workspace_id is not null
  and public.current_user_is_workspace_member(audit_logs.workspace_id)
);

create policy "actors can read their own auth audit logs"
on public.audit_logs
for select
to authenticated
using (
  workspace_id is null
  and actor_user_id = auth.uid()
);

create policy "authenticated users can write scoped audit logs"
on public.audit_logs
for insert
to authenticated
with check (
  actor_user_id = auth.uid()
  and (
    workspace_id is null
    or public.current_user_is_workspace_member(audit_logs.workspace_id)
  )
);

drop policy if exists "workspace members can read sources" on public.sources;
drop policy if exists "workspace editors can create sources" on public.sources;
drop policy if exists "workspace editors can update sources" on public.sources;
drop policy if exists "workspace editors can delete sources" on public.sources;

create policy "workspace members can read sources"
on public.sources
for select
to authenticated
using (public.current_user_is_workspace_member(sources.workspace_id));

create policy "workspace editors can create sources"
on public.sources
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.current_user_can_edit_workspace(sources.workspace_id)
);

create policy "workspace editors can update sources"
on public.sources
for update
to authenticated
using (public.current_user_can_edit_workspace(sources.workspace_id))
with check (public.current_user_can_edit_workspace(sources.workspace_id));

create policy "workspace editors can delete sources"
on public.sources
for delete
to authenticated
using (public.current_user_can_edit_workspace(sources.workspace_id));

drop policy if exists "workspace members can read source versions" on public.source_versions;
drop policy if exists "workspace editors can manage source versions" on public.source_versions;

create policy "workspace members can read source versions"
on public.source_versions
for select
to authenticated
using (public.current_user_is_workspace_member(source_versions.workspace_id));

create policy "workspace editors can manage source versions"
on public.source_versions
for all
to authenticated
using (public.current_user_can_edit_workspace(source_versions.workspace_id))
with check (public.current_user_can_edit_workspace(source_versions.workspace_id));

drop policy if exists "workspace members can read source documents" on public.source_documents;
drop policy if exists "workspace editors can manage source documents" on public.source_documents;

create policy "workspace members can read source documents"
on public.source_documents
for select
to authenticated
using (public.current_user_is_workspace_member(source_documents.workspace_id));

create policy "workspace editors can manage source documents"
on public.source_documents
for all
to authenticated
using (public.current_user_can_edit_workspace(source_documents.workspace_id))
with check (public.current_user_can_edit_workspace(source_documents.workspace_id));

drop policy if exists "workspace members can read source chunks" on public.source_chunks;
drop policy if exists "workspace editors can manage source chunks" on public.source_chunks;

create policy "workspace members can read source chunks"
on public.source_chunks
for select
to authenticated
using (public.current_user_is_workspace_member(source_chunks.workspace_id));

create policy "workspace editors can manage source chunks"
on public.source_chunks
for all
to authenticated
using (public.current_user_can_edit_workspace(source_chunks.workspace_id))
with check (public.current_user_can_edit_workspace(source_chunks.workspace_id));

drop policy if exists "workspace members can read assertions" on public.assertions;
drop policy if exists "workspace editors can create assertions" on public.assertions;
drop policy if exists "workspace editors can update assertions" on public.assertions;
drop policy if exists "workspace admins can delete assertions" on public.assertions;

create policy "workspace members can read assertions"
on public.assertions
for select
to authenticated
using (public.current_user_is_workspace_member(assertions.workspace_id));

create policy "workspace editors can create assertions"
on public.assertions
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.current_user_can_edit_workspace(assertions.workspace_id)
);

create policy "workspace editors can update assertions"
on public.assertions
for update
to authenticated
using (public.current_user_can_edit_workspace(assertions.workspace_id))
with check (public.current_user_can_edit_workspace(assertions.workspace_id));

create policy "workspace admins can delete assertions"
on public.assertions
for delete
to authenticated
using (public.current_user_is_workspace_admin(assertions.workspace_id));

drop policy if exists "workspace members can read assertion sources" on public.assertion_sources;
drop policy if exists "workspace editors can manage assertion sources" on public.assertion_sources;

create policy "workspace members can read assertion sources"
on public.assertion_sources
for select
to authenticated
using (public.current_user_is_workspace_member(assertion_sources.workspace_id));

create policy "workspace editors can manage assertion sources"
on public.assertion_sources
for all
to authenticated
using (public.current_user_can_edit_workspace(assertion_sources.workspace_id))
with check (public.current_user_can_edit_workspace(assertion_sources.workspace_id));

drop policy if exists "workspace members can read assertion templates" on public.assertion_templates;
drop policy if exists "workspace editors can manage workspace assertion templates" on public.assertion_templates;

create policy "workspace members can read assertion templates"
on public.assertion_templates
for select
to authenticated
using (
  is_system = true
  or (
    workspace_id is not null
    and public.current_user_is_workspace_member(assertion_templates.workspace_id)
  )
);

create policy "workspace editors can manage workspace assertion templates"
on public.assertion_templates
for all
to authenticated
using (
  is_system = false
  and workspace_id is not null
  and public.current_user_can_edit_workspace(assertion_templates.workspace_id)
)
with check (
  is_system = false
  and workspace_id is not null
  and public.current_user_can_edit_workspace(assertion_templates.workspace_id)
);

drop policy if exists "workspace members can read assertion schedules" on public.assertion_runs_schedule;
drop policy if exists "workspace editors can manage assertion schedules" on public.assertion_runs_schedule;

create policy "workspace members can read assertion schedules"
on public.assertion_runs_schedule
for select
to authenticated
using (public.current_user_is_workspace_member(assertion_runs_schedule.workspace_id));

create policy "workspace editors can manage assertion schedules"
on public.assertion_runs_schedule
for all
to authenticated
using (public.current_user_can_edit_workspace(assertion_runs_schedule.workspace_id))
with check (public.current_user_can_edit_workspace(assertion_runs_schedule.workspace_id));

drop policy if exists "workspace members can read test cases" on public.test_cases;
drop policy if exists "workspace editors can manage test cases" on public.test_cases;
drop policy if exists "workspace editors can create test cases" on public.test_cases;
drop policy if exists "workspace editors can update test cases" on public.test_cases;
drop policy if exists "workspace editors can delete test cases" on public.test_cases;

create policy "workspace members can read test cases"
on public.test_cases
for select
to authenticated
using (public.current_user_is_workspace_member(test_cases.workspace_id));

create policy "workspace editors can create test cases"
on public.test_cases
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.current_user_can_edit_workspace(test_cases.workspace_id)
);

create policy "workspace editors can update test cases"
on public.test_cases
for update
to authenticated
using (public.current_user_can_edit_workspace(test_cases.workspace_id))
with check (public.current_user_can_edit_workspace(test_cases.workspace_id));

create policy "workspace editors can delete test cases"
on public.test_cases
for delete
to authenticated
using (public.current_user_can_edit_workspace(test_cases.workspace_id));

drop policy if exists "workspace members can read evaluation runs" on public.evaluation_runs;
drop policy if exists "workspace editors can create evaluation runs" on public.evaluation_runs;
drop policy if exists "workspace editors can update evaluation runs" on public.evaluation_runs;
drop policy if exists "workspace admins can delete evaluation runs" on public.evaluation_runs;

create policy "workspace members can read evaluation runs"
on public.evaluation_runs
for select
to authenticated
using (public.current_user_is_workspace_member(evaluation_runs.workspace_id));

create policy "workspace editors can create evaluation runs"
on public.evaluation_runs
for insert
to authenticated
with check (
  triggered_by_user_id = auth.uid()
  and public.current_user_can_edit_workspace(evaluation_runs.workspace_id)
);

create policy "workspace editors can update evaluation runs"
on public.evaluation_runs
for update
to authenticated
using (public.current_user_can_edit_workspace(evaluation_runs.workspace_id))
with check (public.current_user_can_edit_workspace(evaluation_runs.workspace_id));

create policy "workspace admins can delete evaluation runs"
on public.evaluation_runs
for delete
to authenticated
using (public.current_user_is_workspace_admin(evaluation_runs.workspace_id));

drop policy if exists "workspace members can read test case results" on public.test_case_results;
drop policy if exists "workspace editors can create test case results" on public.test_case_results;
drop policy if exists "workspace editors can update test case results" on public.test_case_results;
drop policy if exists "workspace admins can delete test case results" on public.test_case_results;

create policy "workspace members can read test case results"
on public.test_case_results
for select
to authenticated
using (public.current_user_is_workspace_member(test_case_results.workspace_id));

create policy "workspace editors can create test case results"
on public.test_case_results
for insert
to authenticated
with check (public.current_user_can_edit_workspace(test_case_results.workspace_id));

create policy "workspace editors can update test case results"
on public.test_case_results
for update
to authenticated
using (public.current_user_can_edit_workspace(test_case_results.workspace_id))
with check (public.current_user_can_edit_workspace(test_case_results.workspace_id));

create policy "workspace admins can delete test case results"
on public.test_case_results
for delete
to authenticated
using (public.current_user_is_workspace_admin(test_case_results.workspace_id));

drop policy if exists "workspace members can read findings" on public.findings;
drop policy if exists "workspace editors can create findings" on public.findings;
drop policy if exists "workspace editors can update findings" on public.findings;
drop policy if exists "workspace admins can delete findings" on public.findings;

create policy "workspace members can read findings"
on public.findings
for select
to authenticated
using (public.current_user_is_workspace_member(findings.workspace_id));

create policy "workspace editors can create findings"
on public.findings
for insert
to authenticated
with check (public.current_user_can_edit_workspace(findings.workspace_id));

create policy "workspace editors can update findings"
on public.findings
for update
to authenticated
using (public.current_user_can_edit_workspace(findings.workspace_id))
with check (public.current_user_can_edit_workspace(findings.workspace_id));

create policy "workspace admins can delete findings"
on public.findings
for delete
to authenticated
using (public.current_user_is_workspace_admin(findings.workspace_id));

drop policy if exists "workspace members can read finding evidence" on public.finding_evidence;
drop policy if exists "workspace editors can manage finding evidence" on public.finding_evidence;

create policy "workspace members can read finding evidence"
on public.finding_evidence
for select
to authenticated
using (public.current_user_is_workspace_member(finding_evidence.workspace_id));

create policy "workspace editors can manage finding evidence"
on public.finding_evidence
for all
to authenticated
using (public.current_user_can_edit_workspace(finding_evidence.workspace_id))
with check (public.current_user_can_edit_workspace(finding_evidence.workspace_id));

drop policy if exists "workspace members can read finding assignments" on public.finding_assignments;
drop policy if exists "workspace editors can manage finding assignments" on public.finding_assignments;

create policy "workspace members can read finding assignments"
on public.finding_assignments
for select
to authenticated
using (public.current_user_is_workspace_member(finding_assignments.workspace_id));

create policy "workspace editors can manage finding assignments"
on public.finding_assignments
for all
to authenticated
using (public.current_user_can_edit_workspace(finding_assignments.workspace_id))
with check (public.current_user_can_edit_workspace(finding_assignments.workspace_id));

drop policy if exists "workspace members can read finding activity" on public.finding_activity;
drop policy if exists "workspace editors can create finding activity" on public.finding_activity;

create policy "workspace members can read finding activity"
on public.finding_activity
for select
to authenticated
using (public.current_user_is_workspace_member(finding_activity.workspace_id));

create policy "workspace editors can create finding activity"
on public.finding_activity
for insert
to authenticated
with check (public.current_user_can_edit_workspace(finding_activity.workspace_id));

do $$
begin
  if to_regclass('storage.objects') is not null then
    execute 'drop policy if exists "workspace members can read evidence artifacts" on storage.objects';
    execute 'drop policy if exists "workspace editors can create evidence artifacts" on storage.objects';
    execute 'drop policy if exists "workspace editors can update evidence artifacts" on storage.objects';
    execute 'drop policy if exists "workspace admins can delete evidence artifacts" on storage.objects';

    execute $policy$
      create policy "workspace members can read evidence artifacts"
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id = 'radar-evidence-artifacts'
        and public.current_user_is_workspace_member(public.storage_object_workspace_id(name))
      )
    $policy$;

    execute $policy$
      create policy "workspace editors can create evidence artifacts"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'radar-evidence-artifacts'
        and public.current_user_can_edit_workspace(public.storage_object_workspace_id(name))
      )
    $policy$;

    execute $policy$
      create policy "workspace editors can update evidence artifacts"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'radar-evidence-artifacts'
        and public.current_user_can_edit_workspace(public.storage_object_workspace_id(name))
      )
      with check (
        bucket_id = 'radar-evidence-artifacts'
        and public.current_user_can_edit_workspace(public.storage_object_workspace_id(name))
      )
    $policy$;

    execute $policy$
      create policy "workspace admins can delete evidence artifacts"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'radar-evidence-artifacts'
        and public.current_user_is_workspace_admin(public.storage_object_workspace_id(name))
      )
    $policy$;
  end if;
end $$;

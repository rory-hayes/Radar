create type public.workspace_team_visibility as enum ('private', 'workspace');

alter table public.workspaces
add column team_visibility public.workspace_team_visibility not null default 'private';

create policy "workspace admins can update workspace profile"
on public.workspaces
for update
to authenticated
using (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = workspaces.id
      and membership.user_id = auth.uid()
      and membership.role = 'admin'
      and membership.status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = workspaces.id
      and membership.user_id = auth.uid()
      and membership.role = 'admin'
      and membership.status = 'active'
  )
);

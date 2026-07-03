create type public.workspace_status as enum ('active', 'suspended');
create type public.workspace_member_role as enum ('admin', 'editor', 'viewer');
create type public.workspace_member_status as enum ('active', 'invited', 'removed');

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status public.workspace_status not null default 'active',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspaces_name_length check (char_length(trim(name)) between 2 and 80),
  constraint workspaces_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_member_role not null default 'viewer',
  status public.workspace_member_status not null default 'active',
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index workspace_members_user_id_idx on public.workspace_members(user_id);
create index workspace_members_active_workspace_idx on public.workspace_members(workspace_id)
  where status = 'active';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

create trigger workspace_members_set_updated_at
before update on public.workspace_members
for each row execute function public.set_updated_at();

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

create policy "workspace members can read their workspaces"
on public.workspaces
for select
to authenticated
using (
  created_by = auth.uid()
  or
  exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = workspaces.id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

create policy "authenticated users can create owned workspaces"
on public.workspaces
for insert
to authenticated
with check (created_by = auth.uid());

create policy "workspace members can read active memberships"
on public.workspace_members
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members viewer_membership
    where viewer_membership.workspace_id = workspace_members.workspace_id
      and viewer_membership.user_id = auth.uid()
      and viewer_membership.status = 'active'
  )
);

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

create or replace function public.create_workspace_with_admin_membership(
  workspace_name text,
  workspace_slug text
)
returns public.workspaces
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_workspace public.workspaces;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.workspaces (name, slug, created_by)
  values (trim(workspace_name), trim(workspace_slug), auth.uid())
  returning * into new_workspace;

  insert into public.workspace_members (workspace_id, user_id, role, status, joined_at)
  values (new_workspace.id, auth.uid(), 'admin', 'active', now());

  return new_workspace;
end;
$$;

grant execute on function public.create_workspace_with_admin_membership(text, text) to authenticated;

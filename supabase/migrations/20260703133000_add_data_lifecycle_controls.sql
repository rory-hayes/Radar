alter table public.workspaces
add column data_retention_days integer not null default 180,
add column data_retention_updated_at timestamptz not null default now(),
add constraint workspaces_data_retention_days_check check (data_retention_days in (30, 90, 180, 365));

create or replace function public.set_workspace_retention_updated_at()
returns trigger
language plpgsql
as $$
begin
  if new.data_retention_days is distinct from old.data_retention_days then
    new.data_retention_updated_at = now();
  end if;

  return new;
end;
$$;

create trigger workspaces_set_retention_updated_at
before update on public.workspaces
for each row execute function public.set_workspace_retention_updated_at();

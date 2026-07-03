create type public.runner_credential_type as enum (
  'secret',
  'bearer_token',
  'api_key',
  'basic_password'
);

create type public.runner_credential_test_status as enum (
  'untested',
  'verified',
  'failed'
);

alter type public.audit_action add value if not exists 'runner_credential.created';
alter type public.audit_action add value if not exists 'runner_credential.updated';
alter type public.audit_action add value if not exists 'runner_credential.tested';
alter type public.audit_action add value if not exists 'runner_credential.deleted';

create table public.runner_credentials (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  credential_type public.runner_credential_type not null,
  encrypted_value text not null,
  encryption_key_id text not null,
  redaction_label text,
  last_tested_at timestamptz,
  last_test_status public.runner_credential_test_status not null default 'untested',
  last_test_error text,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint runner_credentials_name_length check (char_length(trim(name)) between 1 and 120),
  constraint runner_credentials_encrypted_value_length check (char_length(encrypted_value) between 32 and 20000),
  constraint runner_credentials_encryption_key_id_length check (char_length(trim(encryption_key_id)) between 1 and 120),
  constraint runner_credentials_redaction_label_length check (redaction_label is null or char_length(trim(redaction_label)) between 1 and 120),
  constraint runner_credentials_last_test_error_length check (last_test_error is null or char_length(last_test_error) <= 1000),
  constraint runner_credentials_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint runner_credentials_workspace_name_unique unique (workspace_id, name)
);

create index runner_credentials_workspace_type_idx on public.runner_credentials(workspace_id, credential_type);
create index runner_credentials_workspace_test_status_idx on public.runner_credentials(workspace_id, last_test_status);

create trigger runner_credentials_set_updated_at
before update on public.runner_credentials
for each row execute function public.set_updated_at();

alter table public.runner_credentials enable row level security;
alter table public.runner_credentials force row level security;

create policy "workspace editors can read runner credential metadata"
on public.runner_credentials
for select
to authenticated
using (public.current_user_can_edit_workspace(runner_credentials.workspace_id));

create policy "workspace editors can create runner credentials"
on public.runner_credentials
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.current_user_can_edit_workspace(runner_credentials.workspace_id)
);

create policy "workspace editors can update runner credentials"
on public.runner_credentials
for update
to authenticated
using (public.current_user_can_edit_workspace(runner_credentials.workspace_id))
with check (public.current_user_can_edit_workspace(runner_credentials.workspace_id));

create policy "workspace admins can delete runner credentials"
on public.runner_credentials
for delete
to authenticated
using (public.current_user_is_workspace_admin(runner_credentials.workspace_id));

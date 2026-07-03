create type public.billing_plan as enum ('free', 'starter', 'growth', 'enterprise');

create type public.billing_subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'unpaid',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'paused'
);

create table public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  plan public.billing_plan not null default 'free',
  subscription_status public.billing_subscription_status,
  billing_email text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  unpaid_since timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_customers_stripe_customer_id_length check (
    stripe_customer_id is null or char_length(stripe_customer_id) between 3 and 255
  ),
  constraint billing_customers_stripe_subscription_id_length check (
    stripe_subscription_id is null or char_length(stripe_subscription_id) between 3 and 255
  ),
  constraint billing_customers_stripe_price_id_length check (
    stripe_price_id is null or char_length(stripe_price_id) between 3 and 255
  ),
  constraint billing_customers_billing_email_length check (
    billing_email is null or char_length(billing_email) <= 320
  ),
  constraint billing_customers_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index billing_customers_workspace_idx on public.billing_customers(workspace_id);
create index billing_customers_plan_status_idx on public.billing_customers(plan, subscription_status);
create index billing_customers_stripe_customer_idx on public.billing_customers(stripe_customer_id)
where stripe_customer_id is not null;
create index billing_customers_stripe_subscription_idx on public.billing_customers(stripe_subscription_id)
where stripe_subscription_id is not null;

create trigger billing_customers_set_updated_at
before update on public.billing_customers
for each row execute function public.set_updated_at();

alter table public.billing_customers enable row level security;
alter table public.billing_customers force row level security;

create policy "billing_customers_select_workspace_members"
on public.billing_customers
for select
using (public.current_user_is_workspace_member(billing_customers.workspace_id));

create policy "billing_customers_insert_workspace_admins"
on public.billing_customers
for insert
with check (public.current_user_is_workspace_admin(billing_customers.workspace_id));

create policy "billing_customers_update_workspace_admins"
on public.billing_customers
for update
using (public.current_user_is_workspace_admin(billing_customers.workspace_id))
with check (public.current_user_is_workspace_admin(billing_customers.workspace_id));

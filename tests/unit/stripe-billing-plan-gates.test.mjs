import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function fileExists(relativePath) {
  await access(relativePath);
  return true;
}

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-091 creates workspace-scoped billing persistence with RLS", async () => {
  await fileExists("supabase/migrations/20260703130000_create_billing_customers.sql");

  const migration = await readWorkspaceFile("supabase/migrations/20260703130000_create_billing_customers.sql");
  const repository = await readWorkspaceFile("src/lib/repositories/billing.ts");

  assert.match(migration, /create table public\.billing_customers/);
  assert.match(migration, /workspace_id uuid not null unique references public\.workspaces\(id\) on delete cascade/);
  assert.match(migration, /stripe_customer_id text unique/);
  assert.match(migration, /stripe_subscription_id text unique/);
  assert.match(migration, /alter table public\.billing_customers enable row level security/);
  assert.match(migration, /current_user_is_workspace_member\(billing_customers\.workspace_id\)/);
  assert.match(migration, /current_user_is_workspace_admin\(billing_customers\.workspace_id\)/);
  assert.match(repository, /getBillingCustomerForWorkspace/);
  assert.match(repository, /upsertBillingCustomer/);
  assert.match(repository, /updateBillingCustomerByStripeCustomerId/);
});

test("RAD-091 defines plan limits and safe unpaid gates", async () => {
  const schema = await readWorkspaceFile("src/lib/billing/schema.ts");
  const gates = await readWorkspaceFile("src/lib/billing/plan-gates.ts");
  const enforcement = await readWorkspaceFile("src/lib/billing/enforcement.ts");

  assert.match(schema, /billingPlans = \["free", "starter", "growth", "enterprise"\]/);
  assert.match(schema, /billingPlanLimits/);
  assert.match(schema, /safeUnpaidLimits/);
  assert.match(gates, /evaluateBillingGate/);
  assert.match(gates, /create_assertion/);
  assert.match(gates, /create_source/);
  assert.match(gates, /queue_run/);
  assert.match(gates, /Existing workspace data is preserved/);
  assert.match(enforcement, /getBillingGateResult/);
  assert.match(enforcement, /getWorkspaceBillingUsage/);
});

test("RAD-091 keeps Stripe calls server-only and verifies webhooks", async () => {
  const stripe = await readWorkspaceFile("src/lib/billing/stripe.ts");
  const route = await readWorkspaceFile("src/app/api/billing/stripe-webhook/route.ts");
  const envSchema = await readWorkspaceFile("src/lib/env/schema.ts");
  const envScript = await readWorkspaceFile("scripts/validate-env.mjs");
  const supabase = await readWorkspaceFile("src/lib/supabase/server.ts");

  assert.match(stripe, /import "server-only"/);
  assert.match(stripe, /createStripeCheckoutSession/);
  assert.match(stripe, /createStripeBillingPortalSession/);
  assert.match(stripe, /verifyStripeWebhookSignature/);
  assert.match(stripe, /https:\/\/api\.stripe\.com\/v1/);
  assert.match(stripe, /boundedResponseText/);
  assert.match(route, /stripe-signature/);
  assert.match(route, /checkout\.session\.completed/);
  assert.match(route, /customer\.subscription\.updated/);
  assert.match(route, /createSupabaseServiceRoleClient/);
  assert.match(envSchema, /STRIPE_PRICE_ID_STARTER/);
  assert.match(envScript, /STRIPE_PRICE_ID_STARTER/);
  assert.match(supabase, /createSupabaseServiceRoleClient/);
});

test("RAD-091 gates billing-sensitive product mutations", async () => {
  const assertionActions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");
  const sourceActions = await readWorkspaceFile("src/app/(app)/sources/actions.ts");
  const findingActions = await readWorkspaceFile("src/app/(app)/findings/actions.ts");

  assert.match(assertionActions, /getBillingGateResult/);
  assert.match(assertionActions, /action: "create_assertion"/);
  assert.match(assertionActions, /action: "queue_run"/);
  assert.match(assertionActions, /usageOverride/);
  assert.match(sourceActions, /getBillingGateResult/);
  assert.match(sourceActions, /action: "create_source"/);
  assert.match(findingActions, /getBillingGateResult/);
  assert.match(findingActions, /action: "queue_run"/);
});

test("RAD-091 exposes billing controls in settings without primary-nav bloat", async () => {
  const panel = await readWorkspaceFile("src/components/workspaces/workspace-billing-panel.tsx");
  const page = await readWorkspaceFile("src/app/(app)/settings/page.tsx");
  const actions = await readWorkspaceFile("src/app/(app)/settings/billing-actions.ts");
  const routes = await readWorkspaceFile("src/lib/radar-routes.ts");

  assert.match(panel, /Card/);
  assert.match(panel, /Button/);
  assert.match(panel, /Alert/);
  assert.match(panel, /Progress/);
  assert.match(panel, /createBillingCheckoutSessionAction/);
  assert.match(panel, /createBillingPortalSessionAction/);
  assert.match(page, /WorkspaceBillingPanel/);
  assert.match(page, /getWorkspaceBillingUsage/);
  assert.match(actions, /permission: "workspace:manage"/);
  assert.match(actions, /redirect\(result\.data\)/);
  assert.doesNotMatch(routes, /billing/);
});

test("RAD-091 documents completion and validation", async () => {
  const docs = await readWorkspaceFile("docs/BILLING.md");
  const task = await readWorkspaceFile("tasks/phase-9-production-readiness/rad-091-implement-stripe-billing-and-plan-gates.md");
  const tasks = await readWorkspaceFile("tasks/TASKS.md");

  assert.match(docs, /Stripe environment/);
  assert.match(docs, /Plan gates/);
  assert.match(docs, /safe paused state/);
  assert.match(task, /Result: Done/);
  assert.match(task, /Docker daemon/);
  assert.match(tasks, /RAD-091[\s\S]*Done/);
});

import {
  billingCustomerInputSchema,
  type BillingCustomerInput,
  type BillingPlan,
  type BillingSubscriptionStatus,
} from "@/lib/billing/schema";
import {
  assertRepositorySuccess,
  jsonRecord,
  optionalString,
  requireRepositoryRow,
  type JsonRecord,
  type RadarRepositoryClient,
} from "@/lib/repositories/client";

type BillingCustomerRow = {
  id: string;
  workspace_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan: BillingPlan;
  subscription_status: BillingSubscriptionStatus | null;
  billing_email: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  unpaid_since: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};

export type RadarBillingCustomer = {
  id: string;
  workspaceId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  plan: BillingPlan;
  subscriptionStatus?: BillingSubscriptionStatus;
  billingEmail?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  unpaidSince?: string;
  metadata: JsonRecord;
  createdAt: string;
  updatedAt: string;
};

const billingCustomerSelect = [
  "id",
  "workspace_id",
  "stripe_customer_id",
  "stripe_subscription_id",
  "stripe_price_id",
  "plan",
  "subscription_status",
  "billing_email",
  "current_period_end",
  "cancel_at_period_end",
  "unpaid_since",
  "metadata",
  "created_at",
  "updated_at",
].join(",");

export async function getBillingCustomerForWorkspace(client: RadarRepositoryClient, workspaceId: string) {
  const { data, error } = await client
    .from("billing_customers")
    .select(billingCustomerSelect)
    .eq("workspace_id", workspaceId)
    .maybeSingle<BillingCustomerRow>();

  assertRepositorySuccess(error, "Unable to load billing customer");
  return data ? mapBillingCustomerRow(data) : null;
}

export async function upsertBillingCustomer(client: RadarRepositoryClient, input: BillingCustomerInput) {
  const parsedInput = billingCustomerInputSchema.parse(input);
  const { data, error } = await client
    .from("billing_customers")
    .upsert(
      {
        workspace_id: parsedInput.workspaceId,
        stripe_customer_id: parsedInput.stripeCustomerId ?? null,
        stripe_subscription_id: parsedInput.stripeSubscriptionId ?? null,
        stripe_price_id: parsedInput.stripePriceId ?? null,
        plan: parsedInput.plan,
        subscription_status: parsedInput.subscriptionStatus ?? null,
        billing_email: parsedInput.billingEmail ?? null,
        current_period_end: parsedInput.currentPeriodEnd ?? null,
        cancel_at_period_end: parsedInput.cancelAtPeriodEnd,
        unpaid_since: parsedInput.unpaidSince ?? null,
        metadata: parsedInput.metadata,
      },
      { onConflict: "workspace_id" },
    )
    .select(billingCustomerSelect)
    .single<BillingCustomerRow>();

  assertRepositorySuccess(error, "Unable to save billing customer");
  return mapBillingCustomerRow(requireRepositoryRow(data, "Billing customer upsert returned no row"));
}

export async function updateBillingCustomerByStripeCustomerId(
  client: RadarRepositoryClient,
  stripeCustomerId: string,
  input: Omit<BillingCustomerInput, "workspaceId" | "stripeCustomerId">,
) {
  const parsedInput = billingCustomerInputSchema.partial({ workspaceId: true, stripeCustomerId: true }).parse(input);
  const { data, error } = await client
    .from("billing_customers")
    .update({
      stripe_subscription_id: parsedInput.stripeSubscriptionId ?? null,
      stripe_price_id: parsedInput.stripePriceId ?? null,
      plan: parsedInput.plan,
      subscription_status: parsedInput.subscriptionStatus ?? null,
      billing_email: parsedInput.billingEmail ?? null,
      current_period_end: parsedInput.currentPeriodEnd ?? null,
      cancel_at_period_end: parsedInput.cancelAtPeriodEnd,
      unpaid_since: parsedInput.unpaidSince ?? null,
      metadata: parsedInput.metadata,
    })
    .eq("stripe_customer_id", stripeCustomerId)
    .select(billingCustomerSelect)
    .maybeSingle<BillingCustomerRow>();

  assertRepositorySuccess(error, "Unable to update billing customer");
  return data ? mapBillingCustomerRow(data) : null;
}

function mapBillingCustomerRow(row: BillingCustomerRow): RadarBillingCustomer {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    stripeCustomerId: optionalString(row.stripe_customer_id),
    stripeSubscriptionId: optionalString(row.stripe_subscription_id),
    stripePriceId: optionalString(row.stripe_price_id),
    plan: row.plan,
    subscriptionStatus: row.subscription_status ?? undefined,
    billingEmail: optionalString(row.billing_email),
    currentPeriodEnd: optionalString(row.current_period_end),
    cancelAtPeriodEnd: row.cancel_at_period_end,
    unpaidSince: optionalString(row.unpaid_since),
    metadata: jsonRecord(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

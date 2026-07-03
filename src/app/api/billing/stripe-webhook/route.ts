import { NextResponse } from "next/server";

import {
  normalizeStripeSubscriptionStatus,
  planFromStripePriceId,
  verifyStripeWebhookSignature,
} from "@/lib/billing/stripe";
import {
  updateBillingCustomerByStripeCustomerId,
  upsertBillingCustomer,
} from "@/lib/repositories";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type StripeEvent = {
  id: string;
  type: string;
  data?: {
    object?: Record<string, unknown>;
  };
};

export async function POST(request: Request) {
  const payload = await request.text();
  const signatureHeader = request.headers.get("stripe-signature");

  if (!verifyStripeWebhookSignature({ payload, signatureHeader })) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  const event = JSON.parse(payload) as StripeEvent;
  const supabase = createSupabaseServiceRoleClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase service role is not configured." }, { status: 503 });
  }

  if (event.type === "checkout.session.completed") {
    await handleCheckoutSessionCompleted(supabase, event.data?.object);
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await handleSubscriptionChanged(supabase, event.data?.object);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceRoleClient>>,
  object: Record<string, unknown> | undefined,
) {
  const workspaceId = stringAt(object, "metadata", "workspace_id") ?? stringAt(object, "client_reference_id");
  const stripeCustomerId = stringAt(object, "customer");
  const stripeSubscriptionId = stringAt(object, "subscription");
  const billingEmail = stringAt(object, "customer_details", "email");

  if (!workspaceId || !stripeCustomerId) {
    return;
  }

  await upsertBillingCustomer(supabase, {
    workspaceId,
    stripeCustomerId,
    stripeSubscriptionId,
    plan: "starter",
    subscriptionStatus: "active",
    billingEmail,
    metadata: {
      source: "stripe_checkout_completed",
    },
  });
}

async function handleSubscriptionChanged(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceRoleClient>>,
  object: Record<string, unknown> | undefined,
) {
  const stripeCustomerId = stringAt(object, "customer");
  const stripeSubscriptionId = stringAt(object, "id");
  const stripePriceId = stringAt(object, "items", "data", 0, "price", "id");
  const subscriptionStatus = normalizeStripeSubscriptionStatus(stringAt(object, "status"));

  if (!stripeCustomerId) {
    return;
  }

  await updateBillingCustomerByStripeCustomerId(supabase, stripeCustomerId, {
    stripeSubscriptionId,
    stripePriceId,
    plan: planFromStripePriceId(stripePriceId),
    subscriptionStatus,
    currentPeriodEnd: timestampToIso(numberAt(object, "current_period_end")),
    cancelAtPeriodEnd: booleanAt(object, "cancel_at_period_end") ?? false,
    unpaidSince: subscriptionStatus && ["past_due", "unpaid", "incomplete"].includes(subscriptionStatus)
      ? new Date().toISOString()
      : undefined,
    metadata: {
      source: "stripe_subscription_changed",
    },
  });
}

function stringAt(object: unknown, ...path: Array<string | number>) {
  const value = path.reduce<unknown>((current, segment) => {
    if (current && typeof current === "object") {
      return (current as Record<string, unknown>)[segment];
    }

    return undefined;
  }, object);

  return typeof value === "string" ? value : undefined;
}

function numberAt(object: unknown, ...path: Array<string | number>) {
  const value = path.reduce<unknown>((current, segment) => {
    if (current && typeof current === "object") {
      return (current as Record<string, unknown>)[segment];
    }

    return undefined;
  }, object);

  return typeof value === "number" ? value : undefined;
}

function booleanAt(object: unknown, ...path: Array<string | number>) {
  const value = path.reduce<unknown>((current, segment) => {
    if (current && typeof current === "object") {
      return (current as Record<string, unknown>)[segment];
    }

    return undefined;
  }, object);

  return typeof value === "boolean" ? value : undefined;
}

function timestampToIso(timestamp: number | undefined) {
  return timestamp ? new Date(timestamp * 1000).toISOString() : undefined;
}

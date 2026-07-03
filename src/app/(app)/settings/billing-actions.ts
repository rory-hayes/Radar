"use server";

import { redirect } from "next/navigation";

import {
  billingCheckoutSessionSchema,
  billingPortalSessionSchema,
} from "@/lib/billing/schema";
import {
  createStripeBillingPortalSession,
  createStripeCheckoutSession,
  createStripeCustomer,
} from "@/lib/billing/stripe";
import {
  getBillingCustomerForWorkspace,
  upsertBillingCustomer,
} from "@/lib/repositories";
import {
  runWorkspaceServerAction,
  serverActionError,
  serverActionErrorState,
} from "@/lib/server/guardrails";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BillingActionState = {
  error?: string;
};

export async function createBillingCheckoutSessionAction(
  _previousState: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  const result = await runWorkspaceServerAction(
    {
      input: {
        returnPath: String(formData.get("returnPath") ?? "/settings"),
      },
      permission: "workspace:manage",
      schema: billingCheckoutSessionSchema,
    },
    async ({ input, membership, user }) => {
      const supabase = await createSupabaseServerClient();

      if (!supabase) {
        throw serverActionError("Supabase is not configured for this environment.");
      }

      const existingBillingCustomer = await getBillingCustomerForWorkspace(supabase, membership.workspace.id);
      let stripeCustomerId = existingBillingCustomer?.stripeCustomerId;

      if (!stripeCustomerId) {
        const customerResult = await createStripeCustomer({
          workspaceId: membership.workspace.id,
          email: user.email,
          name: membership.workspace.name,
        });

        if (customerResult.status !== "created") {
          throw serverActionError(customerResult.reason);
        }

        stripeCustomerId = customerResult.id;
        await upsertBillingCustomer(supabase, {
          workspaceId: membership.workspace.id,
          stripeCustomerId,
          plan: existingBillingCustomer?.plan ?? "free",
          subscriptionStatus: existingBillingCustomer?.subscriptionStatus,
          billingEmail: user.email,
          metadata: {
            source: "settings_checkout",
          },
        });
      }

      const session = await createStripeCheckoutSession({
        workspaceId: membership.workspace.id,
        customerId: stripeCustomerId,
        returnPath: input.returnPath,
      });

      if (session.status !== "created") {
        throw serverActionError(session.reason);
      }

      return session.url;
    },
  );

  const error = serverActionErrorState(result);

  if (error) {
    return { error };
  }

  if (result.ok) {
    redirect(result.data);
  }

  return { error: "Unable to create a Stripe checkout session." };
}

export async function createBillingPortalSessionAction(
  _previousState: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  const result = await runWorkspaceServerAction(
    {
      input: {
        returnPath: String(formData.get("returnPath") ?? "/settings"),
      },
      permission: "workspace:manage",
      schema: billingPortalSessionSchema,
    },
    async ({ input, membership }) => {
      const supabase = await createSupabaseServerClient();

      if (!supabase) {
        throw serverActionError("Supabase is not configured for this environment.");
      }

      const billingCustomer = await getBillingCustomerForWorkspace(supabase, membership.workspace.id);

      if (!billingCustomer?.stripeCustomerId) {
        throw serverActionError("Start a subscription before opening the billing portal.", "validation");
      }

      const session = await createStripeBillingPortalSession({
        customerId: billingCustomer.stripeCustomerId,
        returnPath: input.returnPath,
      });

      if (session.status !== "created") {
        throw serverActionError(session.reason);
      }

      return session.url;
    },
  );

  const error = serverActionErrorState(result);

  if (error) {
    return { error };
  }

  if (result.ok) {
    redirect(result.data);
  }

  return { error: "Unable to create a Stripe billing portal session." };
}

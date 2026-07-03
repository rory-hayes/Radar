import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import type { BillingPlan, BillingSubscriptionStatus } from "@/lib/billing/schema";

type StripeRequestOptions = {
  secretKey?: string;
  priceId?: string;
  appUrl?: string;
};

type StripeCustomerInput = {
  workspaceId: string;
  email?: string;
  name?: string;
};

type StripeCheckoutInput = {
  workspaceId: string;
  customerId: string;
  returnPath: string;
};

type StripePortalInput = {
  customerId: string;
  returnPath: string;
};

export type StripeSessionResult =
  | { status: "created"; url: string; id: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

const stripeApiBaseUrl = "https://api.stripe.com/v1";
const maxStripeErrorBytes = 600;

export async function createStripeCustomer(input: StripeCustomerInput, options: StripeRequestOptions = {}) {
  const secretKey = options.secretKey ?? process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return { status: "skipped" as const, reason: "Stripe secret key is not configured." };
  }

  const body = new URLSearchParams();
  body.set("metadata[workspace_id]", input.workspaceId);

  if (input.email) body.set("email", input.email);
  if (input.name) body.set("name", input.name);

  const response = await stripePost("/customers", body, secretKey);

  if (!response.ok) {
    return { status: "failed" as const, reason: response.reason };
  }

  return { status: "created" as const, id: response.data.id as string };
}

export async function createStripeCheckoutSession(
  input: StripeCheckoutInput,
  options: StripeRequestOptions = {},
): Promise<StripeSessionResult> {
  const secretKey = options.secretKey ?? process.env.STRIPE_SECRET_KEY;
  const priceId = options.priceId ?? process.env.STRIPE_PRICE_ID_STARTER;
  const appUrl = normalizedAppUrl(options.appUrl ?? process.env.RADAR_APP_URL);

  if (!secretKey) return { status: "skipped", reason: "Stripe secret key is not configured." };
  if (!priceId) return { status: "skipped", reason: "Stripe starter price id is not configured." };
  if (!appUrl) return { status: "skipped", reason: "Radar app URL is not configured." };

  const body = new URLSearchParams();
  body.set("mode", "subscription");
  body.set("customer", input.customerId);
  body.set("client_reference_id", input.workspaceId);
  body.set("line_items[0][price]", priceId);
  body.set("line_items[0][quantity]", "1");
  body.set("success_url", `${appUrl}${input.returnPath}?billing=success`);
  body.set("cancel_url", `${appUrl}${input.returnPath}?billing=canceled`);
  body.set("metadata[workspace_id]", input.workspaceId);
  body.set("subscription_data[metadata][workspace_id]", input.workspaceId);

  const response = await stripePost("/checkout/sessions", body, secretKey);

  if (!response.ok) {
    return { status: "failed", reason: response.reason };
  }

  return { status: "created", id: response.data.id as string, url: response.data.url as string };
}

export async function createStripeBillingPortalSession(
  input: StripePortalInput,
  options: StripeRequestOptions = {},
): Promise<StripeSessionResult> {
  const secretKey = options.secretKey ?? process.env.STRIPE_SECRET_KEY;
  const appUrl = normalizedAppUrl(options.appUrl ?? process.env.RADAR_APP_URL);

  if (!secretKey) return { status: "skipped", reason: "Stripe secret key is not configured." };
  if (!appUrl) return { status: "skipped", reason: "Radar app URL is not configured." };

  const body = new URLSearchParams();
  body.set("customer", input.customerId);
  body.set("return_url", `${appUrl}${input.returnPath}`);

  const response = await stripePost("/billing_portal/sessions", body, secretKey);

  if (!response.ok) {
    return { status: "failed", reason: response.reason };
  }

  return { status: "created", id: response.data.id as string, url: response.data.url as string };
}

export function verifyStripeWebhookSignature(input: {
  payload: string;
  signatureHeader: string | null;
  webhookSecret?: string;
  toleranceSeconds?: number;
}) {
  const webhookSecret = input.webhookSecret ?? process.env.STRIPE_WEBHOOK_SECRET;
  const toleranceSeconds = input.toleranceSeconds ?? 300;

  if (!webhookSecret || !input.signatureHeader) {
    return false;
  }

  const parts = new Map(
    input.signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value] as const;
    }),
  );
  const timestamp = parts.get("t");
  const signature = parts.get("v1");

  if (!timestamp || !signature) {
    return false;
  }

  const timestampMs = Number(timestamp) * 1000;

  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > toleranceSeconds * 1000) {
    return false;
  }

  const expected = createHmac("sha256", webhookSecret).update(`${timestamp}.${input.payload}`).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
}

export function planFromStripePriceId(priceId: string | undefined): BillingPlan {
  if (!priceId) return "free";

  const pricePlanMap: Record<string, BillingPlan | undefined> = {
    [process.env.STRIPE_PRICE_ID_STARTER ?? ""]: "starter",
  };

  return pricePlanMap[priceId] ?? "starter";
}

export function normalizeStripeSubscriptionStatus(status: string | undefined): BillingSubscriptionStatus | undefined {
  if (
    status === "trialing" ||
    status === "active" ||
    status === "past_due" ||
    status === "unpaid" ||
    status === "canceled" ||
    status === "incomplete" ||
    status === "incomplete_expired" ||
    status === "paused"
  ) {
    return status;
  }

  return undefined;
}

async function stripePost(path: string, body: URLSearchParams, secretKey: string) {
  const response = await fetch(`${stripeApiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await response.json().catch(async () => ({ error: { message: await boundedResponseText(response) } }));

  if (!response.ok) {
    const message = typeof data?.error?.message === "string" ? data.error.message : "Stripe request failed.";
    return { ok: false as const, reason: message.slice(0, maxStripeErrorBytes) };
  }

  return { ok: true as const, data: data as Record<string, unknown> };
}

async function boundedResponseText(response: Response) {
  const text = await response.text().catch(() => "");
  return text.slice(0, maxStripeErrorBytes);
}

function normalizedAppUrl(value: string | undefined) {
  if (!value) return undefined;
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

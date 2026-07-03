import { z } from "zod";

export const billingPlans = ["free", "starter", "growth", "enterprise"] as const;
export const billingSubscriptionStatuses = [
  "trialing",
  "active",
  "past_due",
  "unpaid",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "paused",
] as const;

export type BillingPlan = (typeof billingPlans)[number];
export type BillingSubscriptionStatus = (typeof billingSubscriptionStatuses)[number];

export type BillingPlanLimits = {
  assertions: number | null;
  sources: number | null;
  monthlyRuns: number | null;
};

export type BillingCustomerInput = {
  workspaceId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  plan?: BillingPlan;
  subscriptionStatus?: BillingSubscriptionStatus;
  billingEmail?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  unpaidSince?: string;
  metadata?: Record<string, unknown>;
};

export const billingPlanLimits = {
  free: {
    assertions: 3,
    sources: 3,
    monthlyRuns: 25,
  },
  starter: {
    assertions: 25,
    sources: 25,
    monthlyRuns: 500,
  },
  growth: {
    assertions: 100,
    sources: 100,
    monthlyRuns: 5000,
  },
  enterprise: {
    assertions: null,
    sources: null,
    monthlyRuns: null,
  },
} as const satisfies Record<BillingPlan, BillingPlanLimits>;

export const safeUnpaidLimits = {
  assertions: 0,
  sources: 0,
  monthlyRuns: 0,
} as const satisfies BillingPlanLimits;

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional(),
);

export const billingCustomerInputSchema = z.object({
  workspaceId: z.uuid(),
  stripeCustomerId: optionalTrimmedString.pipe(z.string().max(255).optional()),
  stripeSubscriptionId: optionalTrimmedString.pipe(z.string().max(255).optional()),
  stripePriceId: optionalTrimmedString.pipe(z.string().max(255).optional()),
  plan: z.enum(billingPlans).default("free"),
  subscriptionStatus: z.enum(billingSubscriptionStatuses).optional(),
  billingEmail: optionalTrimmedString.pipe(z.email().max(320).optional()),
  currentPeriodEnd: optionalTrimmedString.pipe(z.iso.datetime().optional()),
  cancelAtPeriodEnd: z.boolean().default(false),
  unpaidSince: optionalTrimmedString.pipe(z.iso.datetime().optional()),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const billingCheckoutSessionSchema = z.object({
  returnPath: z.string().trim().startsWith("/").max(200).default("/settings"),
});

export const billingPortalSessionSchema = billingCheckoutSessionSchema;

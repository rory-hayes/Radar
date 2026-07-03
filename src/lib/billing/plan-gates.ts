import {
  billingPlanLimits,
  safeUnpaidLimits,
  type BillingPlan,
  type BillingPlanLimits,
  type BillingSubscriptionStatus,
} from "@/lib/billing/schema";
import type { RadarBillingCustomer } from "@/lib/repositories/billing";

export type BillingUsage = {
  assertions: number;
  sources: number;
  monthlyRuns: number;
};

export type BillingGateAction = "create_assertion" | "create_source" | "queue_run";

export type BillingEntitlement = {
  plan: BillingPlan;
  subscriptionStatus?: BillingSubscriptionStatus;
  isPaid: boolean;
  isUnpaid: boolean;
  limits: BillingPlanLimits;
};

const paidStatuses = new Set<BillingSubscriptionStatus>(["active", "trialing"]);
const unpaidStatuses = new Set<BillingSubscriptionStatus>([
  "past_due",
  "unpaid",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "paused",
]);

export function deriveBillingEntitlement(customer?: RadarBillingCustomer | null): BillingEntitlement {
  const plan = customer?.plan ?? "free";
  const subscriptionStatus = customer?.subscriptionStatus;
  const isPaid = plan !== "free" && Boolean(subscriptionStatus && paidStatuses.has(subscriptionStatus));
  const isUnpaid = plan !== "free" && Boolean(subscriptionStatus && unpaidStatuses.has(subscriptionStatus));

  return {
    plan,
    subscriptionStatus,
    isPaid,
    isUnpaid,
    limits: isUnpaid ? safeUnpaidLimits : billingPlanLimits[plan],
  };
}

export function evaluateBillingGate(input: {
  customer?: RadarBillingCustomer | null;
  usage: BillingUsage;
  action: BillingGateAction;
}) {
  const entitlement = deriveBillingEntitlement(input.customer);

  if (entitlement.isUnpaid) {
    return {
      allowed: false,
      entitlement,
      message: "Billing needs attention before creating new assertions, sources, or runs. Existing workspace data is preserved.",
    };
  }

  const limitKey = billingGateLimitKey(input.action);
  const currentUsage = input.usage[limitKey];
  const limit = entitlement.limits[limitKey];

  if (limit === null || currentUsage < limit) {
    return { allowed: true, entitlement, message: undefined };
  }

  return {
    allowed: false,
    entitlement,
    message: `The ${entitlement.plan} plan allows ${limit} ${billingGateLabel(limitKey)}. Manage billing to raise this limit.`,
  };
}

export function billingGateLimitKey(action: BillingGateAction): keyof BillingUsage {
  if (action === "create_assertion") return "assertions";
  if (action === "create_source") return "sources";
  return "monthlyRuns";
}

export function billingGateLabel(limitKey: keyof BillingUsage) {
  if (limitKey === "monthlyRuns") return "runs per month";
  return limitKey;
}

export function countMonthlyRuns<T extends { createdAt: string }>(runs: readonly T[], now = new Date()) {
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return runs.filter((run) => {
    const createdAt = Date.parse(run.createdAt);
    return Number.isFinite(createdAt) && createdAt >= monthStart.getTime();
  }).length;
}

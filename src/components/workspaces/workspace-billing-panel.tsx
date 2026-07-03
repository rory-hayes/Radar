"use client";

import { CreditCardIcon, ExternalLinkIcon, ShieldAlertIcon } from "lucide-react";
import { useActionState } from "react";

import {
  createBillingCheckoutSessionAction,
  createBillingPortalSessionAction,
  type BillingActionState,
} from "@/app/(app)/settings/billing-actions";
import { StatusBadge, type StatusTone } from "@/components/radar/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { billingGateLabel, deriveBillingEntitlement, type BillingUsage } from "@/lib/billing/plan-gates";
import type { RadarBillingCustomer } from "@/lib/repositories/billing";

type WorkspaceBillingPanelProps = {
  billingCustomer: RadarBillingCustomer | null;
  usage: BillingUsage;
  canManage: boolean;
};

const initialState: BillingActionState = {};

export function WorkspaceBillingPanel({ billingCustomer, usage, canManage }: WorkspaceBillingPanelProps) {
  const [checkoutState, checkoutAction, checkoutPending] = useActionState(createBillingCheckoutSessionAction, initialState);
  const [portalState, portalAction, portalPending] = useActionState(createBillingPortalSessionAction, initialState);
  const entitlement = deriveBillingEntitlement(billingCustomer);
  const statusLabel = entitlement.subscriptionStatus ?? (entitlement.plan === "free" ? "free" : "not active");
  const statusTone: StatusTone = entitlement.isUnpaid ? "warning" : entitlement.isPaid ? "pass" : "neutral";
  const hasStripeCustomer = Boolean(billingCustomer?.stripeCustomerId);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>Billing</CardTitle>
            <CardDescription>Plan state and usage gates for this workspace.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={entitlement.plan} />
            <StatusBadge tone={statusTone} label={statusLabel} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {entitlement.isUnpaid ? (
          <Alert variant="destructive">
            <ShieldAlertIcon aria-hidden="true" />
            <AlertTitle>Billing action required</AlertTitle>
            <AlertDescription>
              New assertions, sources, and verification runs are paused while existing workspace data remains readable.
            </AlertDescription>
          </Alert>
        ) : null}
        {checkoutState.error || portalState.error ? (
          <Alert variant="destructive">
            <ShieldAlertIcon aria-hidden="true" />
            <AlertTitle>Stripe session unavailable</AlertTitle>
            <AlertDescription>{checkoutState.error ?? portalState.error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-3">
          <UsageLimitRow label="Assertions" value={usage.assertions} limit={entitlement.limits.assertions} />
          <UsageLimitRow label="Sources" value={usage.sources} limit={entitlement.limits.sources} />
          <UsageLimitRow label="Monthly runs" value={usage.monthlyRuns} limit={entitlement.limits.monthlyRuns} />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:justify-end">
        <form action={checkoutAction}>
          <input type="hidden" name="returnPath" value="/settings" />
          <Button type="submit" className="w-full sm:w-auto" disabled={!canManage || checkoutPending}>
            <CreditCardIcon data-icon="inline-start" />
            {entitlement.plan === "free" ? "Start subscription" : "Change plan"}
          </Button>
        </form>
        <form action={portalAction}>
          <input type="hidden" name="returnPath" value="/settings" />
          <Button
            type="submit"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={!canManage || !hasStripeCustomer || portalPending}
          >
            <ExternalLinkIcon data-icon="inline-start" />
            Manage billing
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

function UsageLimitRow({
  label,
  value,
  limit,
}: {
  label: string;
  value: number;
  limit: number | null;
}) {
  const progress = limit === null ? 12 : Math.min(100, Math.round((value / Math.max(limit, 1)) * 100));

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">
          {value} / {limit === null ? "unlimited" : limit}
        </span>
      </div>
      <Progress value={progress} className="mt-3" aria-label={`${billingGateLabel(limitKeyForLabel(label))} usage`} />
    </div>
  );
}

function limitKeyForLabel(label: string): keyof BillingUsage {
  if (label === "Monthly runs") return "monthlyRuns";
  if (label === "Sources") return "sources";
  return "assertions";
}

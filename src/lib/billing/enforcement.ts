import {
  evaluateBillingGate,
  type BillingGateAction,
  type BillingUsage,
} from "@/lib/billing/plan-gates";
import { getWorkspaceBillingUsage } from "@/lib/billing/workspace-usage";
import {
  getBillingCustomerForWorkspace,
  type RadarRepositoryClient,
} from "@/lib/repositories";

export async function getBillingGateResult(input: {
  client: RadarRepositoryClient;
  workspaceId: string;
  action: BillingGateAction;
  usageOverride?: Partial<BillingUsage>;
}) {
  const [customer, usage] = await Promise.all([
    getBillingCustomerForWorkspace(input.client, input.workspaceId),
    getWorkspaceBillingUsage(input.client, input.workspaceId),
  ]);

  return evaluateBillingGate({
    customer,
    usage: {
      ...usage,
      ...input.usageOverride,
    },
    action: input.action,
  });
}

import { countMonthlyRuns, type BillingUsage } from "@/lib/billing/plan-gates";
import {
  listAssertions,
  listEvaluationRunSummariesForWorkspace,
  listSources,
  type RadarRepositoryClient,
} from "@/lib/repositories";

export async function getWorkspaceBillingUsage(
  client: RadarRepositoryClient,
  workspaceId: string,
): Promise<BillingUsage> {
  const [assertions, sources, runs] = await Promise.all([
    listAssertions(client, workspaceId),
    listSources(client, workspaceId),
    listEvaluationRunSummariesForWorkspace(client, workspaceId, { limit: 5000 }),
  ]);

  return {
    assertions: assertions.length,
    sources: sources.length,
    monthlyRuns: countMonthlyRuns(runs),
  };
}

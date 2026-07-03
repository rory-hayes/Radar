import type { Metadata } from "next";

import { PageHeader } from "@/components/app-shell";
import { CommandCenterKpiSummary } from "@/components/command-center";
import { ErrorState } from "@/components/radar";
import { buildCommandCenterKpiSummary } from "@/lib/command-center/kpi-summary";
import { getAppRouteByHref } from "@/lib/radar-routes";
import {
  listAssertions,
  countApprovedTestCasesForWorkspace,
  listEvaluationRunSummariesForWorkspace,
  listFindings,
  listRecentFindingActivityForWorkspace,
  listSources,
} from "@/lib/repositories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveWorkspace } from "@/lib/workspaces/server";

const route = getAppRouteByHref("/command-center");

export const metadata: Metadata = {
  title: "Command Center | Radar",
};

export default async function CommandCenterPage() {
  const membership = await requireActiveWorkspace();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <CommandCenterShell>
        <ErrorState
          title="Command Center could not load"
          description="Supabase is not configured for this environment, so Radar cannot read workspace verification summaries."
          reference="command_center.supabase_unconfigured"
        />
      </CommandCenterShell>
    );
  }

  const result = await loadCommandCenterSummary(supabase, membership.workspace.id);

  if (result.error || !result.summary) {
    return (
      <CommandCenterShell>
        <ErrorState
          title="Command Center could not load"
          description="Radar could not read the active workspace summary. Refresh after checking database connectivity and workspace permissions."
          reference={result.error ?? "command_center.repository_error"}
        />
      </CommandCenterShell>
    );
  }

  return (
    <CommandCenterShell status={`${result.summary.exceptions} exceptions`}>
      <CommandCenterKpiSummary summary={result.summary} />
    </CommandCenterShell>
  );
}

async function loadCommandCenterSummary(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  workspaceId: string,
) {
  try {
    const [assertions, findings, runs, sources, findingActivity, approvedTestCaseCount] = await Promise.all([
      listAssertions(supabase, workspaceId),
      listFindings(supabase, workspaceId),
      listEvaluationRunSummariesForWorkspace(supabase, workspaceId),
      listSources(supabase, workspaceId),
      listRecentFindingActivityForWorkspace(supabase, workspaceId),
      countApprovedTestCasesForWorkspace(supabase, workspaceId),
    ]);

    return {
      summary: buildCommandCenterKpiSummary({
        assertions,
        findings,
        sources,
        runs,
        findingActivity,
        approvedTestCaseCount,
      }),
      error: null,
    };
  } catch (error) {
    return {
      summary: null,
      error: error instanceof Error ? error.message : "command_center.repository_error",
    };
  }
}

function CommandCenterShell({
  children,
  status,
}: {
  children: React.ReactNode;
  status?: string;
}) {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={route?.title ?? "Command Center"} description={route?.description ?? ""} status={status} />
      {children}
    </section>
  );
}

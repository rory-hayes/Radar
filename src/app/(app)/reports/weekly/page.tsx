import type { Metadata } from "next";

import { PageHeader } from "@/components/app-shell";
import { ErrorState } from "@/components/radar";
import { WeeklyTrustReportDetail } from "@/components/reports/weekly-trust-report-detail";
import { trackProductEvent } from "@/lib/analytics/posthog";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { buildWeeklyTrustReportExportPayload } from "@/lib/reports/report-export";
import { generateWeeklyTrustReport } from "@/lib/reports/weekly-trust-report";
import { listAssertions, listEvaluationRunSummariesForWorkspace, listFindings } from "@/lib/repositories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveWorkspace } from "@/lib/workspaces/server";

export const metadata: Metadata = {
  title: "Weekly Trust Report | Radar",
};

export const dynamic = "force-dynamic";

export default async function WeeklyTrustReportPage() {
  const membership = await requireActiveWorkspace();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <ReportShell>
        <ErrorState
          title="Report could not load"
          description="Supabase is not configured for this environment, so Radar cannot generate the weekly trust report."
          reference="weekly_report.supabase_unconfigured"
        />
      </ReportShell>
    );
  }

  const result = await loadWeeklyTrustReport(supabase, membership.workspace.id);

  if (result.error || !result.report || !result.exportPayload) {
    return (
      <ReportShell>
        <ErrorState
          title="Report could not load"
          description="Radar could not read the active workspace report data. Refresh after checking database connectivity and workspace permissions."
          reference={result.error ?? "weekly_report.repository_error"}
        />
      </ReportShell>
    );
  }

  const user = await getAuthenticatedUser();
  await trackProductEvent({
    event: "report_viewed",
    properties: {
      workspaceId: membership.workspace.id,
      userId: user?.id,
      reportId: result.report.id,
      periodStart: result.report.period.start,
      periodEnd: result.report.period.end,
      activeExceptions: result.report.activeExceptions,
      passRate: (result.report.passRate ?? 0) / 100,
    },
  });

  return (
    <ReportShell status={result.report.period.label}>
      <WeeklyTrustReportDetail report={result.report} exportPayload={result.exportPayload} />
    </ReportShell>
  );
}

async function loadWeeklyTrustReport(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  workspaceId: string,
) {
  try {
    const [assertions, findings, runs] = await Promise.all([
      listAssertions(supabase, workspaceId),
      listFindings(supabase, workspaceId),
      listEvaluationRunSummariesForWorkspace(supabase, workspaceId),
    ]);
    const report = generateWeeklyTrustReport({ assertions, findings, runs });

    return {
      report,
      exportPayload: buildWeeklyTrustReportExportPayload(report),
      error: null,
    };
  } catch (error) {
    return {
      report: null,
      exportPayload: null,
      error: error instanceof Error ? error.message : "weekly_report.repository_error",
    };
  }
}

function ReportShell({
  children,
  status,
}: {
  children: React.ReactNode;
  status?: string;
}) {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Weekly trust report"
        description="Business-readable verification summary for the current workspace."
        status={status}
      />
      {children}
    </section>
  );
}

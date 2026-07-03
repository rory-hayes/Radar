import type { WeeklyTrustReport } from "@/lib/reports/weekly-trust-report";
import type { EvidenceArtifactKind } from "@/lib/validation";

export type ReportExportBlock =
  | {
      type: "paragraph";
      title: string;
      body: string;
    }
  | {
      type: "metrics";
      title: string;
      metrics: WeeklyTrustReport["metrics"];
    }
  | {
      type: "risk_categories";
      title: string;
      categories: WeeklyTrustReport["riskyCategories"];
    }
  | {
      type: "findings";
      title: string;
      findings: WeeklyTrustReport["openExceptions"] | WeeklyTrustReport["resolvedFindings"];
    }
  | {
      type: "next_actions";
      title: string;
      actions: WeeklyTrustReport["recommendedNextActions"];
    };

export type ReportExportPayload = {
  schemaVersion: "radar.report-export.v1";
  reportId: string;
  title: string;
  generatedAt: string;
  period: WeeklyTrustReport["period"];
  artifactKind: Extract<EvidenceArtifactKind, "report-export">;
  suggestedFileName: string;
  formats: readonly ["json", "pdf", "email"];
  blocks: ReportExportBlock[];
};

export function buildWeeklyTrustReportExportPayload(report: WeeklyTrustReport): ReportExportPayload {
  return {
    schemaVersion: "radar.report-export.v1",
    reportId: report.id,
    title: report.title,
    generatedAt: report.generatedAt,
    period: report.period,
    artifactKind: "report-export",
    suggestedFileName: weeklyReportFileName(report),
    formats: ["json", "pdf", "email"],
    blocks: [
      {
        type: "paragraph",
        title: "Executive summary",
        body: report.executiveSummary,
      },
      {
        type: "metrics",
        title: "Weekly metrics",
        metrics: report.metrics,
      },
      {
        type: "risk_categories",
        title: "Risky categories",
        categories: report.riskyCategories,
      },
      {
        type: "findings",
        title: "Open exceptions",
        findings: report.openExceptions,
      },
      {
        type: "findings",
        title: "Resolved findings",
        findings: report.resolvedFindings,
      },
      {
        type: "next_actions",
        title: "Recommended next actions",
        actions: report.recommendedNextActions,
      },
    ],
  };
}

function weeklyReportFileName(report: WeeklyTrustReport) {
  const start = report.period.start.slice(0, 10);
  const end = report.period.end.slice(0, 10);
  return `radar-weekly-trust-report-${start}-${end}.json`;
}

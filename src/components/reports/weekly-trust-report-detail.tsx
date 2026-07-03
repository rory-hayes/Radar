import { ArrowLeftIcon, ArrowRightIcon, FileDownIcon } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/radar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ReportExportPayload } from "@/lib/reports/report-export";
import type { WeeklyTrustReport } from "@/lib/reports/weekly-trust-report";

type WeeklyTrustReportDetailProps = {
  report: WeeklyTrustReport;
  exportPayload: ReportExportPayload;
};

export function WeeklyTrustReportDetail({ report, exportPayload }: WeeklyTrustReportDetailProps) {
  const exportJsonHref = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportPayload, null, 2))}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/command-center">
            <ArrowLeftIcon data-icon="inline-start" />
            Command Center
          </Link>
        </Button>
        <StatusBadge tone={report.activeExceptions > 0 ? "warning" : "pass"} label={report.period.label} />
      </div>

      <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
        <CardHeader>
          <CardTitle>{report.title}</CardTitle>
          <CardDescription>{report.executiveSummary}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          {report.metrics.map((metric) => (
            <div key={metric.label} className="rounded-md border bg-background p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium tracking-normal text-muted-foreground uppercase">{metric.label}</p>
                <StatusBadge tone={metric.tone} label={metric.value} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{metric.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.45fr)]">
        <div className="flex flex-col gap-4">
          <ReportSection title="Risky categories" emptyLabel="No elevated category risk this week">
            {report.riskyCategories.map((category) => (
              <div key={category.category} className="rounded-md border bg-background p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold">{category.label}</h2>
                  <StatusBadge tone={category.tone} label={category.criticalFindings > 0 ? "Critical" : "Review"} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{category.summary}</p>
              </div>
            ))}
          </ReportSection>

          <ReportSection title="Open exceptions" emptyLabel="No active exceptions">
            {report.openExceptions.map((finding) => (
              <FindingRow key={finding.id} finding={finding} />
            ))}
          </ReportSection>

          <ReportSection title="Resolved findings" emptyLabel="No findings resolved this week">
            {report.resolvedFindings.map((finding) => (
              <FindingRow key={finding.id} finding={finding} />
            ))}
          </ReportSection>
        </div>

        <div className="flex flex-col gap-4">
          <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
            <CardHeader>
              <CardTitle>Export scaffold</CardTitle>
              <CardDescription>{exportPayload.suggestedFileName}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <DetailItem label="Schema" value={exportPayload.schemaVersion} />
              <DetailItem label="Artifact kind" value={exportPayload.artifactKind} />
              <DetailItem label="Blocks" value={String(exportPayload.blocks.length)} />
              <DetailItem label="Formats" value={exportPayload.formats.join(", ")} />
              <Button asChild variant="outline" size="sm" className="mt-1 justify-start">
                <a href={exportJsonHref} download={exportPayload.suggestedFileName}>
                  <FileDownIcon data-icon="inline-start" />
                  Export-ready JSON
                </a>
              </Button>
            </CardContent>
          </Card>

          <ReportSection title="Recommended next actions" emptyLabel="No action needed">
            {report.recommendedNextActions.map((action) => (
              <div key={action.id} className="rounded-md border bg-background p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold">{action.title}</h2>
                  <StatusBadge tone={action.tone} label={actionLabel(action.tone)} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{action.description}</p>
                {action.href ? (
                  <Button asChild variant="ghost" size="sm" className="mt-2 px-0">
                    <Link href={action.href}>
                      Open
                      <ArrowRightIcon data-icon="inline-end" />
                    </Link>
                  </Button>
                ) : null}
              </div>
            ))}
          </ReportSection>
        </div>
      </div>
    </div>
  );
}

function FindingRow({ finding }: { finding: WeeklyTrustReport["openExceptions"][number] }) {
  return (
    <div className="rounded-md border bg-background p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">{finding.title}</h2>
        <StatusBadge tone={finding.severity === "critical" ? "fail" : "warning"} label={finding.severity} />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{finding.customerImpact}</p>
      <Separator className="my-3" />
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <DetailItem label="Assertion" value={finding.assertionTitle} />
        <DetailItem label="Recommended fix" value={finding.recommendedFix} />
      </div>
    </div>
  );
}

function ReportSection({
  title,
  emptyLabel,
  children,
}: {
  title: string;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {hasChildren ? children : <p className="text-sm text-muted-foreground">{emptyLabel}</p>}
      </CardContent>
    </Card>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-normal text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}

function actionLabel(tone: WeeklyTrustReport["recommendedNextActions"][number]["tone"]) {
  if (tone === "fail") return "Escalate";
  if (tone === "warning") return "Review";
  if (tone === "pass") return "Clear";
  return "Track";
}

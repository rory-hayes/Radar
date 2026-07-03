import { ArrowRightIcon, FileTextIcon } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/radar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { WeeklyTrustReport } from "@/lib/reports/weekly-trust-report";

type WeeklyTrustReportPanelProps = {
  report: WeeklyTrustReport;
};

export function WeeklyTrustReportPanel({ report }: WeeklyTrustReportPanelProps) {
  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle>Weekly trust report</CardTitle>
            <CardDescription>{report.period.label}</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/reports/weekly">
              <FileTextIcon data-icon="inline-start" />
              Open report
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm leading-6 text-muted-foreground">{report.executiveSummary}</p>
        <div className="grid gap-3 md:grid-cols-4">
          {report.metrics.map((metric) => (
            <div key={metric.label} className="rounded-md border bg-background p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium tracking-normal text-muted-foreground uppercase">{metric.label}</p>
                <StatusBadge tone={metric.tone} label={metric.value} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{metric.detail}</p>
            </div>
          ))}
        </div>

        <Separator />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <ReportSection title="Risky categories" emptyLabel="No elevated category risk this week">
            {report.riskyCategories.map((category) => (
              <div key={category.category} className="rounded-md border bg-background p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold">{category.label}</h2>
                  <StatusBadge tone={category.tone} label={category.criticalFindings > 0 ? "Critical" : "Review"} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{category.summary}</p>
              </div>
            ))}
          </ReportSection>

          <ReportSection title="Recommended next actions" emptyLabel="No action needed">
            {report.recommendedNextActions.map((action) => (
              <div key={action.id} className="rounded-md border bg-background p-3">
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
      </CardContent>
    </Card>
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
    <div>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <div className="mt-3 flex flex-col gap-3">
        {hasChildren ? children : <p className="text-sm text-muted-foreground">{emptyLabel}</p>}
      </div>
    </div>
  );
}

function actionLabel(tone: WeeklyTrustReport["recommendedNextActions"][number]["tone"]) {
  if (tone === "fail") return "Escalate";
  if (tone === "warning") return "Review";
  if (tone === "pass") return "Clear";
  return "Track";
}

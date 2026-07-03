import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { EmptyState, MetricCard, StatusBadge, type StatusTone } from "@/components/radar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AssertionHealthPanel } from "@/components/command-center/assertion-health-panel";
import { NeedsAttentionPanel } from "@/components/command-center/needs-attention-panel";
import type { CommandCenterKpiSummary as CommandCenterKpiSummaryData } from "@/lib/command-center/kpi-summary";

type CommandCenterKpiSummaryProps = {
  summary: CommandCenterKpiSummaryData;
};

export function CommandCenterKpiSummary({ summary }: CommandCenterKpiSummaryProps) {
  const passRateLabel = summary.passRate === null ? "No runs" : `${summary.passRate}%`;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Checks run"
          value={summary.checksRun}
          helperText="Completed checks in the last 7 days."
          tone={summary.checksRun > 0 ? "pass" : "neutral"}
          statusLabel="7 days"
          className="xl:col-span-2"
        />
        <MetricCard
          label="Exceptions"
          value={summary.exceptions}
          helperText="Open, investigating, or fixed findings."
          tone={summary.exceptions > 0 ? "warning" : "pass"}
          statusLabel={summary.exceptions > 0 ? "Review" : "Clear"}
          className="xl:col-span-2"
        />
        <MetricCard
          label="Critical issues"
          value={summary.criticalIssues}
          helperText="Highest-risk customer-facing findings."
          tone={summary.criticalIssues > 0 ? "fail" : "pass"}
          statusLabel="Risk"
          className="xl:col-span-2"
        />
        <MetricCard
          label="Recommended fixes"
          value={summary.recommendedFixes}
          helperText="Active findings with grounded fix guidance."
          tone={summary.recommendedFixes > 0 ? "warning" : "neutral"}
          statusLabel="Fixes"
          className="xl:col-span-2"
        />
        <MetricCard
          label="Pass rate"
          value={passRateLabel}
          helperText="Passed test cases across completed checks."
          tone={passRateTone(summary.passRate)}
          statusLabel="Quality"
          className="xl:col-span-2"
        />
        <MetricCard
          label="Monitored assertions"
          value={summary.monitoredAssertions}
          helperText="Active business assertions in this workspace."
          tone={summary.monitoredAssertions > 0 ? "pass" : "neutral"}
          statusLabel="Active"
          className="xl:col-span-2"
        />
      </div>

      <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
        <CardHeader>
          <CardTitle>Trend indicators</CardTitle>
          <CardDescription>Small signals for today&apos;s operational review.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {summary.trends.map((trend) => (
            <div key={trend.label} className="flex flex-col gap-3 rounded-md border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{trend.label}</p>
                  <p className="text-sm text-muted-foreground">{trend.detail}</p>
                </div>
                <StatusBadge tone={trend.tone} label={trend.value} />
              </div>
              {trend.label === "Pass rate" && summary.passRate !== null ? (
                <Progress value={summary.passRate} aria-label="Command Center pass rate" />
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <NeedsAttentionPanel findings={summary.needsAttention} />

      <AssertionHealthPanel categories={summary.categoryHealth} />

      {!summary.hasActivity ? (
        <EmptyState
          title="No verification activity yet"
          description="Command Center will populate after assertions have approved sources, runner coverage, and evaluation runs."
          details={["Create assertions", "Attach required sources", "Run checks"]}
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/assertions">
                <ArrowRightIcon data-icon="inline-start" />
                Start in Assertions
              </Link>
            </Button>
          }
        />
      ) : null}
    </div>
  );
}

function passRateTone(passRate: number | null): StatusTone {
  if (passRate === null) return "neutral";
  if (passRate >= 95) return "pass";
  if (passRate >= 80) return "warning";
  return "fail";
}

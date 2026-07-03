import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";

import { EmptyState, SeverityBadge, StatusBadge, type StatusTone } from "@/components/radar";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { CommandCenterNeedsAttentionItem } from "@/lib/command-center/kpi-summary";

type NeedsAttentionPanelProps = {
  findings: readonly CommandCenterNeedsAttentionItem[];
};

export function NeedsAttentionPanel({ findings }: NeedsAttentionPanelProps) {
  if (findings.length === 0) {
    return (
      <EmptyState
        title="Nothing needs attention"
        description="Radar will list the most important open findings here when checks uncover customer-facing exceptions."
        details={["Severity", "Affected assertion", "Recommended fix"]}
      />
    );
  }

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>Needs attention</CardTitle>
        <CardDescription>Highest-priority open findings ranked by severity, status, and confidence.</CardDescription>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link href="/findings">
              <ArrowUpRightIcon data-icon="inline-start" />
              Open findings
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {findings.map((finding, index) => (
          <div key={finding.id} className="flex flex-col gap-4">
            <article className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(16rem,0.7fr)]">
              <div className="flex min-w-0 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={finding.severity} />
                  <StatusBadge tone={statusTone(finding.status)} label={formatStatus(finding.status)} />
                  <span className="text-sm text-muted-foreground">{formatConfidence(finding.confidence)} confidence</span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">{finding.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Affected assertion: {finding.assertionTitle}</p>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{finding.customerImpact}</p>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs font-medium tracking-normal text-muted-foreground uppercase">Primary fix</p>
                  <p className="mt-1 text-sm leading-6 text-foreground">{finding.recommendedFix}</p>
                </div>
                <Progress value={Math.round(finding.confidence * 100)} aria-label={`${finding.title} confidence`} />
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link href={`/findings?finding=${finding.id}`}>
                      <ArrowUpRightIcon data-icon="inline-start" />
                      Review finding
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/assertions/${finding.assertionId}`}>Open assertion</Link>
                  </Button>
                </div>
              </div>
            </article>
            {index < findings.length - 1 ? <Separator /> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function statusTone(status: CommandCenterNeedsAttentionItem["status"]): StatusTone {
  const tones: Record<CommandCenterNeedsAttentionItem["status"], StatusTone> = {
    open: "fail",
    investigating: "warning",
    fixed: "pass",
    resolved: "pass",
    ignored: "neutral",
    false_positive: "neutral",
  };

  return tones[status];
}

function formatStatus(status: CommandCenterNeedsAttentionItem["status"]) {
  return status
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function formatConfidence(confidence: number) {
  return `${Math.round(confidence * 100)}%`;
}

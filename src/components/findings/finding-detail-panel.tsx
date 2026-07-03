import Link from "next/link";
import {
  ArrowUpRightIcon,
  CheckCircle2Icon,
  ClockIcon,
} from "lucide-react";

import {
  EmptyState,
  EvidenceDiff,
  SeverityBadge,
  StatusBadge,
  type StatusTone,
} from "@/components/radar";
import { FindingLifecycleForm } from "@/components/findings/finding-lifecycle-form";
import { FindingOwnershipForm, type FindingOwnerOption } from "@/components/findings/finding-ownership-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type {
  FindingActivityType,
  FindingEvidenceType,
  FindingOwnerTeam,
  FindingStatus,
  RadarFindingEvidence,
} from "@/lib/findings/schema";
import type { RadarFindingActivity } from "@/lib/repositories";
import type { FindingListItem } from "@/components/findings/finding-inbox";
import { allowedFindingStatusTargets } from "@/lib/findings/lifecycle-workflow";

export type FindingDetailPanelProps = {
  finding?: FindingListItem;
  evidence: readonly RadarFindingEvidence[];
  activity: readonly RadarFindingActivity[];
  canResolve: boolean;
  ownerOptions: readonly FindingOwnerOption[];
};

export function FindingDetailPanel({ finding, evidence, activity, canResolve, ownerOptions }: FindingDetailPanelProps) {
  if (!finding) {
    return (
      <EmptyState
        title="Select a finding"
        description="Choose a finding from the inbox to review expected versus actual behavior, evidence, activity, and actions."
        details={["Expected vs actual", "Evidence", "Actions"]}
      />
    );
  }

  return (
    <aside className="flex flex-col gap-4">
      <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
        <CardHeader>
          <CardTitle>{finding.title}</CardTitle>
          <CardDescription>{finding.summary}</CardDescription>
          <CardAction className="flex items-center gap-2">
            <SeverityBadge severity={finding.severity} />
            <StatusBadge tone={statusTone(finding.status)} label={formatStatus(finding.status)} />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-1">
            <DetailItem label="Affected assertion" value={finding.assertionTitle ?? "Assertion unavailable"} />
            <DetailItem label="Confidence" value={formatConfidence(finding.confidence)} />
            <DetailItem label="Owner" value={formatOwner(finding.ownerUserId)} />
            <DetailItem label="Team" value={formatOwnerTeam(finding.ownerTeam)} />
            <DetailItem label="Run" value={finding.evaluationRunId ? shortId(finding.evaluationRunId) : "No run linked"} />
          </dl>
        </CardContent>
        <CardFooter className="flex-wrap justify-start gap-2">
          <Button asChild size="sm">
            <Link href={`/assertions/${finding.assertionId}`}>
              <ArrowUpRightIcon data-icon="inline-start" />
              Open assertion
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/assertions/${finding.assertionId}?tab=runs`}>
              <ClockIcon data-icon="inline-start" />
              Review run history
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <FindingLifecycleForm
        findingId={finding.id}
        currentStatus={finding.status}
        allowedStatuses={allowedFindingStatusTargets(finding.status)}
        canResolve={canResolve}
      />

      <FindingOwnershipForm
        findingId={finding.id}
        ownerUserId={finding.ownerUserId}
        ownerTeam={finding.ownerTeam}
        severity={finding.severity}
        ownerOptions={ownerOptions}
        canManage={canResolve}
      />

      <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
        <CardHeader>
          <CardTitle>Expected vs actual</CardTitle>
          <CardDescription>Business-readable mismatch summary for this finding.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <ComparisonBlock label="Expected" value={finding.expected} />
          <ComparisonBlock label="Actual" value={finding.actual} />
        </CardContent>
      </Card>

      <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
        <CardHeader>
          <CardTitle>Customer impact</CardTitle>
          <CardDescription>Why this exception matters before it is fixed.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">{finding.customerImpact}</p>
        </CardContent>
      </Card>

      <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
        <CardHeader>
          <CardTitle>Recommended fix</CardTitle>
          <CardDescription>Grounded next step generated from the evidence.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">{finding.recommendedFix}</p>
        </CardContent>
      </Card>

      <FindingEvidenceList finding={finding} evidence={evidence} />
      <FindingActivityList activity={activity} />
    </aside>
  );
}

function FindingEvidenceList({
  finding,
  evidence,
}: {
  finding: FindingListItem;
  evidence: readonly RadarFindingEvidence[];
}) {
  if (evidence.length === 0) {
    return (
      <EmptyState
        title="No evidence rows linked"
        description="This finding does not yet have source, artifact, or run-output evidence rows attached."
        details={["Source evidence", "Run output", "Artifact"]}
      />
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold">Evidence</h2>
        <p className="text-sm text-muted-foreground">Source excerpts, run output, and artifacts tied to this issue.</p>
      </div>
      {evidence.map((item) => (
        <EvidenceDiff
          key={item.id}
          title={formatEvidenceType(item.evidenceType)}
          sourceLabel={evidenceSourceLabel(item)}
          sourceText={evidenceText(item, finding.expected)}
          actualText={finding.actual}
          citation={item.citation}
          confidenceLabel={typeof item.confidence === "number" ? formatConfidence(item.confidence) : undefined}
        />
      ))}
    </section>
  );
}

function FindingActivityList({ activity }: { activity: readonly RadarFindingActivity[] }) {
  if (activity.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        description="Lifecycle updates will appear after status, assignment, evidence, rerun, or comment events."
        details={["Status", "Assignment", "Rerun"]}
      />
    );
  }

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>Latest lifecycle events for this finding.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {activity.map((item, index) => (
          <div key={item.id} className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle2Icon className="mt-0.5 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{formatActivityType(item.activityType)}</p>
                <p className="text-sm text-muted-foreground">
                  {item.note ?? activityStatusChange(item) ?? "Workspace activity recorded."}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{formatTimestamp(item.createdAt)}</p>
              </div>
            </div>
            {index < activity.length - 1 ? <Separator /> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-normal text-muted-foreground uppercase">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

function ComparisonBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-xs font-medium tracking-normal text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

function statusTone(status: FindingStatus): StatusTone {
  const tones: Record<FindingStatus, StatusTone> = {
    open: "fail",
    investigating: "warning",
    fixed: "pass",
    resolved: "pass",
    ignored: "neutral",
    false_positive: "neutral",
  };

  return tones[status];
}

function formatEvidenceType(type: FindingEvidenceType) {
  return titleize(type);
}

function evidenceSourceLabel(evidence: RadarFindingEvidence) {
  if (evidence.sourceChunkId) return `Source chunk ${shortId(evidence.sourceChunkId)}`;
  if (evidence.sourceDocumentId) return `Source document ${shortId(evidence.sourceDocumentId)}`;
  if (evidence.sourceId) return `Source ${shortId(evidence.sourceId)}`;
  if (evidence.artifactPath) return "Runner artifact";
  if (evidence.evaluationRunId) return `Run ${shortId(evidence.evaluationRunId)}`;
  return "Finding evidence";
}

function evidenceText(evidence: RadarFindingEvidence, fallback: string) {
  return evidence.quote ?? evidence.citation ?? evidence.artifactPath ?? fallback;
}

function activityStatusChange(activity: RadarFindingActivity) {
  if (activity.fromStatus && activity.toStatus) {
    return `Status changed from ${formatStatus(activity.fromStatus)} to ${formatStatus(activity.toStatus)}.`;
  }

  return undefined;
}

function formatActivityType(type: FindingActivityType) {
  return titleize(type);
}

function formatStatus(status: FindingStatus) {
  return titleize(status);
}

function formatOwner(ownerUserId?: string) {
  return ownerUserId ? `User ${ownerUserId.slice(0, 8)}` : "Unassigned";
}

function formatOwnerTeam(team?: FindingOwnerTeam) {
  if (!team) return "Unassigned";
  return team === "ops" ? "Ops" : `${team.charAt(0).toUpperCase()}${team.slice(1)}`;
}

function formatConfidence(confidence: number) {
  return `${Math.round(confidence * 100)}%`;
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function shortId(value: string) {
  return value.slice(0, 8);
}

function titleize(value: string) {
  return value
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

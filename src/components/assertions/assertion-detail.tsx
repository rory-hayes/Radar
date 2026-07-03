import Link from "next/link";

import { AssertionManualRunPanel } from "@/components/assertions/assertion-manual-run-panel";
import { AssertionSourceLinkingPanel } from "@/components/assertions/assertion-source-linking-panel";
import { AssertionTestCaseManager } from "@/components/assertions/assertion-test-case-manager";
import { KnowledgeTargetConfigurationPanel } from "@/components/assertions/knowledge-target-configuration-panel";
import { EmptyState, MetricCard, SeverityBadge, StatusBadge, type StatusTone } from "@/components/radar";
import {
  formatSourceTimestamp,
  sourceSyncStatusLabel,
  sourceSyncStatusTone,
  sourceTypeLabel,
} from "@/components/sources/source-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  AssertionCategory,
  AssertionPriority,
  AssertionStatus,
  RadarAssertion,
  RadarTestCase,
  RunnerType,
} from "@/lib/assertions/schema";
import type { RadarFinding } from "@/lib/findings/schema";
import type {
  RadarAssertionRunSchedule,
  RadarAssertionSource,
  RadarEvaluationRunSummary,
} from "@/lib/repositories";
import type { KnowledgeTargetConfigurationSet } from "@/lib/evaluation/knowledge-targets";
import { approvedRunnableTestCasesForRunner } from "@/lib/evaluation/manual-reruns";
import type { TestCaseResultStatus } from "@/lib/evaluation/schema";
import type { RadarSource } from "@/lib/sources/schema";

export type AssertionLinkedSource = RadarSource & {
  link: RadarAssertionSource;
};

export type AssertionFailedTestCaseRerunCandidate = {
  id: string;
  title: string;
  latestRunId: string;
  latestResultStatus: TestCaseResultStatus;
};

export type AssertionDetailViewProps = {
  assertion: RadarAssertion;
  schedule?: RadarAssertionRunSchedule;
  availableSources: readonly RadarSource[];
  linkedSources: readonly AssertionLinkedSource[];
  testCases: readonly RadarTestCase[];
  runHistory: readonly RadarEvaluationRunSummary[];
  failedTestCaseRerunCandidates: readonly AssertionFailedTestCaseRerunCandidate[];
  findings: readonly RadarFinding[];
  knowledgeTargets?: KnowledgeTargetConfigurationSet;
  canEditSources: boolean;
  canEditTestCases: boolean;
  canRunAssertions: boolean;
};

export function AssertionDetailView({
  assertion,
  schedule,
  availableSources,
  linkedSources,
  testCases,
  runHistory,
  failedTestCaseRerunCandidates,
  findings,
  knowledgeTargets,
  canEditSources,
  canEditTestCases,
  canRunAssertions,
}: AssertionDetailViewProps) {
  const latestRun = runHistory[0];
  const openFindings = findings.filter((finding) => finding.status !== "resolved" && finding.status !== "ignored").length;
  const runnableTestCaseCount = approvedRunnableTestCasesForRunner(assertion.runnerType, testCases).length;

  return (
    <div className="flex flex-col gap-6">
      <AssertionDetailMetrics
        assertion={assertion}
        linkedSources={linkedSources}
        testCases={testCases}
        latestRun={latestRun}
        openFindings={openFindings}
      />

      <Tabs defaultValue="overview" className="flex flex-col gap-4">
        <TabsList className="w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="test-cases">Test cases</TabsTrigger>
          <TabsTrigger value="runs">Runs</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <AssertionOverview
            assertion={assertion}
            schedule={schedule}
            latestRun={latestRun}
            runnableTestCaseCount={runnableTestCaseCount}
            failedTestCaseRerunCandidates={failedTestCaseRerunCandidates}
            canRunAssertions={canRunAssertions}
          />
        </TabsContent>
        <TabsContent value="sources">
          <AssertionSources
            assertion={assertion}
            availableSources={availableSources}
            linkedSources={linkedSources}
            knowledgeTargets={knowledgeTargets}
            canEditSources={canEditSources}
          />
        </TabsContent>
        <TabsContent value="test-cases">
          <AssertionTestCaseManager assertion={assertion} testCases={testCases} canEdit={canEditTestCases} />
        </TabsContent>
        <TabsContent value="runs">
          <AssertionRunHistory runs={runHistory} />
        </TabsContent>
        <TabsContent value="findings">
          <AssertionFindings findings={findings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AssertionDetailMetrics({
  assertion,
  linkedSources,
  testCases,
  latestRun,
  openFindings,
}: {
  assertion: RadarAssertion;
  linkedSources: readonly AssertionLinkedSource[];
  testCases: readonly RadarTestCase[];
  latestRun?: RadarEvaluationRunSummary;
  openFindings: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Linked sources"
        value={linkedSources.length}
        helperText="Evidence inputs attached to this assertion."
        tone={linkedSources.length > 0 ? "pass" : "neutral"}
        statusLabel="Evidence"
      />
      <MetricCard
        label="Test cases"
        value={testCases.length}
        helperText="Customer-facing checks configured for this assertion."
        tone={testCases.length > 0 ? "pass" : "neutral"}
        statusLabel="Coverage"
      />
      <MetricCard
        label="Latest score"
        value={latestRun?.score === undefined ? "No runs" : `${Math.round(latestRun.score * 100)}%`}
        helperText="Most recent assertion run result."
        tone={latestRunStatusTone(latestRun)}
        statusLabel={latestRun ? formatRunStatus(latestRun.status) : "Pending"}
      />
      <MetricCard
        label="Open findings"
        value={openFindings}
        helperText={`Priority is ${formatPriority(assertion.priority).toLowerCase()}.`}
        tone={openFindings > 0 ? "warning" : "neutral"}
        statusLabel="Issues"
      />
    </div>
  );
}

function AssertionOverview({
  assertion,
  schedule,
  latestRun,
  runnableTestCaseCount,
  failedTestCaseRerunCandidates,
  canRunAssertions,
}: {
  assertion: RadarAssertion;
  schedule?: RadarAssertionRunSchedule;
  latestRun?: RadarEvaluationRunSummary;
  runnableTestCaseCount: number;
  failedTestCaseRerunCandidates: readonly AssertionFailedTestCaseRerunCandidate[];
  canRunAssertions: boolean;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
        <CardHeader>
          <CardTitle>Assertion summary</CardTitle>
          <CardDescription>What Radar verifies and why it matters to the customer experience.</CardDescription>
          <CardAction>
            <StatusBadge tone={assertionStatusTone(assertion.status)} label={formatStatus(assertion.status)} />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <DetailBlock label="Purpose" value={assertion.purpose} />
          <Separator />
          <DetailBlock label="Expected behaviour" value={assertion.expectedBehavior} />
        </CardContent>
      </Card>
      <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Metadata that controls how this business truth is monitored.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 text-sm">
            <DetailItem label="Category" value={formatCategory(assertion.category)} />
            <DetailItem label="Runner" value={formatRunnerType(assertion.runnerType)} />
            <DetailItem label="Priority" value={formatPriority(assertion.priority)} />
            <DetailItem label="Owner" value={formatOwner(assertion.ownerUserId)} />
            <DetailItem label="Schedule" value={formatSchedule(schedule)} />
            <DetailItem label="Source-change trigger" value={schedule?.sourceChangeTrigger ? "Enabled" : "Disabled"} />
            <DetailItem label="Next run" value={formatOptionalTimestamp(schedule?.nextRunAt)} />
            <DetailItem
              label="Latest run"
              value={latestRun ? formatOptionalTimestamp(latestRun.completedAt ?? latestRun.createdAt) : "Never"}
            />
          </dl>
        </CardContent>
      </Card>
      <div className="lg:col-span-2">
        <AssertionManualRunPanel
          assertion={assertion}
          runnableTestCaseCount={runnableTestCaseCount}
          latestRun={latestRun}
          failedTestCaseRerunCandidates={failedTestCaseRerunCandidates}
          canRun={canRunAssertions}
        />
      </div>
    </div>
  );
}

function AssertionSources({
  assertion,
  availableSources,
  linkedSources,
  knowledgeTargets,
  canEditSources,
}: {
  assertion: RadarAssertion;
  availableSources: readonly RadarSource[];
  linkedSources: readonly AssertionLinkedSource[];
  knowledgeTargets?: KnowledgeTargetConfigurationSet;
  canEditSources: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <KnowledgeTargetConfigurationPanel configuration={knowledgeTargets} canEdit={canEditSources} />
      <AssertionSourceLinkingPanel
        assertion={assertion}
        availableSources={availableSources}
        linkedSources={linkedSources}
        canEdit={canEditSources}
      />
      <LinkedSourceTable sources={linkedSources} />
    </div>
  );
}

function LinkedSourceTable({ sources }: { sources: readonly AssertionLinkedSource[] }) {
  if (sources.length === 0) {
    return (
      <EmptyState
        title="No evidence sources linked"
        description="Attach only the sources needed to verify this customer-facing assertion."
        details={["Source name", "Sync health", "Evidence role"]}
      />
    );
  }

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>Linked sources</CardTitle>
        <CardDescription>Minimum evidence inputs Radar uses for this assertion.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-(--card-spacing)">Source</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last sync</TableHead>
              <TableHead className="pr-(--card-spacing)">Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source) => (
              <TableRow key={source.id}>
                <TableCell className="pl-(--card-spacing)">
                  <Link href={`/sources/${source.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                    {source.name}
                  </Link>
                  <p className="line-clamp-2 max-w-lg text-sm text-muted-foreground">
                    {source.link.purpose ?? source.description ?? "Evidence input for this assertion."}
                  </p>
                </TableCell>
                <TableCell>{sourceTypeLabel(source.type)}</TableCell>
                <TableCell>
                  <StatusBadge tone={sourceSyncStatusTone(source.syncStatus)} label={sourceSyncStatusLabel(source.syncStatus)} />
                </TableCell>
                <TableCell>{formatSourceTimestamp(source.lastSyncedAt)}</TableCell>
                <TableCell className="pr-(--card-spacing)">
                  <Badge variant="outline">{source.link.isRequired ? "Required" : "Supporting"}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AssertionRunHistory({ runs }: { runs: readonly RadarEvaluationRunSummary[] }) {
  if (runs.length === 0) {
    return (
      <EmptyState
        title="No run history yet"
        description="Run history will appear after Radar starts evaluating this assertion."
        details={["Run status", "Pass rate", "Triggered by"]}
      />
    );
  }

  const latestRun = runs[0];
  const firstFailureRun = firstFailureInHistory(runs);
  const currentPassRate = latestRun ? passRate(latestRun) : undefined;

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>Run history</CardTitle>
        <CardDescription>Recent assertion evaluations, pass rate, and first visible failure marker.</CardDescription>
        <CardAction>
          <StatusBadge tone={latestRun ? runStatusTone(latestRun.status) : "neutral"} label={latestRun ? formatRunStatus(latestRun.status) : "No runs"} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-0">
        <div className="grid gap-3 px-(--card-spacing) md:grid-cols-3">
          <RunHistorySummaryItem
            label="Latest state"
            value={latestRun ? formatRunStatus(latestRun.status) : "No runs"}
            helper={latestRun ? `${formatResultMix(latestRun)} from ${latestRun.totalTestCases} test cases` : "No completed evaluation yet."}
          />
          <RunHistorySummaryItem
            label="Latest pass rate"
            value={typeof currentPassRate === "number" ? `${Math.round(currentPassRate * 100)}%` : "No rate"}
            helper={latestRun ? `Score ${formatScore(latestRun.score)} · confidence ${formatScore(latestRun.confidence)}` : "Waiting for scored results."}
          />
          <RunHistorySummaryItem
            label="First failure in view"
            value={firstFailureRun ? formatOptionalTimestamp(firstFailureRun.completedAt ?? firstFailureRun.createdAt) : "None"}
            helper={firstFailureRun ? `Run ${firstFailureRun.id.slice(0, 8)} introduced ${firstFailureRun.failedCount + firstFailureRun.errorCount} issue(s).` : "Visible runs have no failed or errored test cases."}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-(--card-spacing)">Run</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead className="text-right">Pass rate</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-right">Confidence</TableHead>
              <TableHead>Result mix</TableHead>
              <TableHead className="pr-(--card-spacing)">Completed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow key={run.id}>
                <TableCell className="pl-(--card-spacing)">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-xs">{run.id.slice(0, 8)}</span>
                    {firstFailureRun?.id === run.id ? <Badge variant="destructive">First failure</Badge> : null}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge tone={runStatusTone(run.status)} label={formatRunStatus(run.status)} />
                </TableCell>
                <TableCell>{titleize(run.triggerType)}</TableCell>
                <TableCell className="text-right">{formatPassRate(run)}</TableCell>
                <TableCell className="text-right">{formatScore(run.score)}</TableCell>
                <TableCell className="text-right">{formatScore(run.confidence)}</TableCell>
                <TableCell>{formatResultMix(run)}</TableCell>
                <TableCell className="pr-(--card-spacing)">
                  {formatOptionalTimestamp(run.completedAt ?? run.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RunHistorySummaryItem({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-md border border-border/80 bg-muted/25 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{helper}</p>
    </div>
  );
}

function AssertionFindings({ findings }: { findings: readonly RadarFinding[] }) {
  if (findings.length === 0) {
    return (
      <EmptyState
        title="No findings linked"
        description="Evidence-backed findings will appear here when this assertion exposes a customer-facing issue."
        details={["Expected vs actual", "Customer impact", "Recommended fix"]}
      />
    );
  }

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>Linked findings</CardTitle>
        <CardDescription>Issues created from evidence-backed evaluations for this assertion.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-(--card-spacing)">Finding</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Confidence</TableHead>
              <TableHead className="pr-(--card-spacing)">Recommended fix</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {findings.map((finding) => (
              <TableRow key={finding.id}>
                <TableCell className="pl-(--card-spacing)">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="font-medium text-foreground">{finding.title}</span>
                    <span className="line-clamp-2 max-w-lg text-sm text-muted-foreground">{finding.customerImpact}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <SeverityBadge severity={finding.severity} />
                </TableCell>
                <TableCell>
                  <StatusBadge tone={findingStatusTone(finding.status)} label={titleize(finding.status)} />
                </TableCell>
                <TableCell className="text-right">{Math.round(finding.confidence * 100)}%</TableCell>
                <TableCell className="max-w-xl pr-(--card-spacing)">
                  <p className="line-clamp-2 text-sm text-muted-foreground">{finding.recommendedFix}</p>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-muted-foreground">{label}</h2>
      <p className="text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium text-foreground">{value}</dd>
    </div>
  );
}

function assertionStatusTone(status: AssertionStatus): StatusTone {
  const tones: Record<AssertionStatus, StatusTone> = {
    active: "pass",
    draft: "neutral",
    paused: "warning",
    archived: "neutral",
  };

  return tones[status];
}

function runStatusTone(status: RadarEvaluationRunSummary["status"]): StatusTone {
  if (status === "passed") {
    return "pass";
  }

  if (status === "failed" || status === "error" || status === "canceled") {
    return "fail";
  }

  if (status === "warning" || status === "inconclusive") {
    return "warning";
  }

  return "running";
}

function latestRunStatusTone(run?: RadarEvaluationRunSummary): StatusTone {
  return run ? runStatusTone(run.status) : "neutral";
}

function findingStatusTone(status: RadarFinding["status"]): StatusTone {
  if (status === "open" || status === "investigating") {
    return "warning";
  }

  if (status === "fixed" || status === "resolved") {
    return "pass";
  }

  return "neutral";
}

function formatStatus(status: AssertionStatus) {
  return titleize(status);
}

function formatCategory(category: AssertionCategory) {
  return titleize(category.replace("_", " / "));
}

function formatPriority(priority: AssertionPriority) {
  return titleize(priority);
}

function formatRunnerType(runnerType: RunnerType) {
  return `${titleize(runnerType)} Runner`;
}

function formatOwner(ownerUserId?: string) {
  return ownerUserId ? `User ${ownerUserId.slice(0, 8)}` : "Unassigned";
}

function formatSchedule(schedule?: RadarAssertionRunSchedule) {
  if (!schedule) {
    return "Manual";
  }

  if (!schedule.isEnabled && !schedule.sourceChangeTrigger) {
    return "Manual";
  }

  if (schedule.sourceChangeTrigger && schedule.cadence === "manual") {
    return "Source change";
  }

  const cadence = titleize(schedule.cadence);
  return schedule.sourceChangeTrigger ? `${cadence} + source change` : cadence;
}

function formatRunStatus(status: RadarEvaluationRunSummary["status"]) {
  return titleize(status);
}

function firstFailureInHistory(runs: readonly RadarEvaluationRunSummary[]) {
  return [...runs].reverse().find((run) => run.failedCount + run.errorCount > 0);
}

function passRate(run: RadarEvaluationRunSummary) {
  return run.totalTestCases > 0 ? run.passedCount / run.totalTestCases : undefined;
}

function formatPassRate(run: RadarEvaluationRunSummary) {
  const rate = passRate(run);

  return typeof rate === "number" ? `${Math.round(rate * 100)}%` : "No rate";
}

function formatScore(score?: number) {
  return typeof score === "number" ? `${Math.round(score * 100)}%` : "No score";
}

function formatResultMix(run: RadarEvaluationRunSummary) {
  return `${run.passedCount} pass · ${run.warningCount} warn · ${run.failedCount + run.errorCount} fail/error`;
}

function formatOptionalTimestamp(value?: string) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function titleize(value: string) {
  return value
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

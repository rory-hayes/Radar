"use client";

import { useActionState } from "react";
import { AlertCircleIcon, CheckCircle2Icon, LoaderCircleIcon, PlayIcon, RotateCcwIcon } from "lucide-react";

import {
  queueManualAssertionRunAction,
  type ManualRunState,
} from "@/app/(app)/assertions/actions";
import { StatusBadge, type StatusTone } from "@/components/radar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import type { RadarAssertion } from "@/lib/assertions/schema";
import type { EvaluationRunStatus, TestCaseResultStatus } from "@/lib/evaluation/schema";

type AssertionManualRunPanelProps = {
  assertion: RadarAssertion;
  runnableTestCaseCount: number;
  latestRun?: ManualRunSummary;
  failedTestCaseRerunCandidates: readonly FailedTestCaseRerunCandidate[];
  canRun: boolean;
};

type ManualRunSummary = {
  id: string;
  status: EvaluationRunStatus;
  totalTestCases: number;
  passedCount: number;
  warningCount: number;
  failedCount: number;
  errorCount: number;
  createdAt: string;
  completedAt?: string;
};

type FailedTestCaseRerunCandidate = {
  id: string;
  title: string;
  latestRunId: string;
  latestResultStatus: TestCaseResultStatus;
};

const initialState: ManualRunState = {};

export function AssertionManualRunPanel({
  assertion,
  runnableTestCaseCount,
  latestRun,
  failedTestCaseRerunCandidates,
  canRun,
}: AssertionManualRunPanelProps) {
  const [state, formAction, isPending] = useActionState(queueManualAssertionRunAction, initialState);
  const canQueue = canRun && runnableTestCaseCount > 0;

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>Manual verification</CardTitle>
        <CardDescription>
          Rerun this assertion after source, policy, or answer-target fixes.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FieldGroup>
          {state.error ? (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Run not queued</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          {state.success ? (
            <Alert>
              <CheckCircle2Icon />
              <AlertTitle>Run queued</AlertTitle>
              <AlertDescription>{state.success}</AlertDescription>
            </Alert>
          ) : null}
        </FieldGroup>

        <div className="grid gap-3 rounded-md border bg-background p-3 text-sm md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">{runnableTestCaseCount} runnable approved test cases</span>
              <StatusBadge tone={latestRun ? runStatusTone(latestRun.status) : "neutral"} label={latestRun ? formatRunStatus(latestRun.status) : "No runs"} />
            </div>
            <span className="text-muted-foreground">
              {latestRun
                ? `Latest run checked ${latestRun.totalTestCases} test cases with ${latestRun.failedCount + latestRun.errorCount} fail/error results.`
                : "No previous run is available for this assertion yet."}
            </span>
          </div>
          {canRun ? (
            <form action={formAction}>
              <input type="hidden" name="assertionId" value={assertion.id} />
              <Button type="submit" disabled={isPending || !canQueue}>
                {isPending ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : <PlayIcon data-icon="inline-start" />}
                Queue manual run
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">You do not have permission to queue runs.</p>
          )}
        </div>

        {failedTestCaseRerunCandidates.length > 0 ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">Failed test cases</p>
              <Badge variant="secondary">{failedTestCaseRerunCandidates.length} rerun candidates</Badge>
            </div>
            <div className="flex flex-col gap-2">
              {failedTestCaseRerunCandidates.map((candidate) => (
                <form
                  key={candidate.id}
                  action={formAction}
                  className="flex flex-col gap-3 rounded-md border border-border/80 bg-muted/20 p-3 md:flex-row md:items-center md:justify-between"
                >
                  <input type="hidden" name="assertionId" value={assertion.id} />
                  <input type="hidden" name="testCaseId" value={candidate.id} />
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="line-clamp-1 font-medium text-foreground">{candidate.title}</span>
                      <Badge
                        variant={
                          candidate.latestResultStatus === "failed" || candidate.latestResultStatus === "error"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {formatRunStatus(candidate.latestResultStatus)}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Latest failed run {candidate.latestRunId.slice(0, 8)} can be rerun without queueing unaffected checks.
                    </span>
                  </div>
                  <Button type="submit" variant="outline" disabled={isPending || !canQueue}>
                    {isPending ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : <RotateCcwIcon data-icon="inline-start" />}
                    Rerun failed case
                  </Button>
                </form>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function runStatusTone(status: EvaluationRunStatus): StatusTone {
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

function formatRunStatus(status: string) {
  return status
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

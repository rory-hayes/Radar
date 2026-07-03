"use client";

import { useActionState } from "react";
import { AlertCircleIcon, CheckCircle2Icon, LoaderCircleIcon, PlayIcon } from "lucide-react";

import {
  queueManualAssertionRunAction,
  type ManualRunState,
} from "@/app/(app)/assertions/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import type { RadarAssertion } from "@/lib/assertions/schema";

type AssertionManualRunPanelProps = {
  assertion: RadarAssertion;
  approvedTestCaseCount: number;
  canRun: boolean;
};

const initialState: ManualRunState = {};

export function AssertionManualRunPanel({
  assertion,
  approvedTestCaseCount,
  canRun,
}: AssertionManualRunPanelProps) {
  const [state, formAction, isPending] = useActionState(queueManualAssertionRunAction, initialState);
  const canQueue = canRun && approvedTestCaseCount > 0;

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>Manual verification</CardTitle>
        <CardDescription>
          Queue this assertion for verification without running the full evaluation engine yet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <input type="hidden" name="assertionId" value={assertion.id} />
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
            <div className="flex flex-col gap-3 rounded-md border bg-background p-3 text-sm md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-foreground">{approvedTestCaseCount} approved test cases</span>
                <span className="text-muted-foreground">
                  Manual runs create a queued run record now; execution is added in the runner phase.
                </span>
              </div>
              {canRun ? (
                <Button type="submit" disabled={isPending || !canQueue}>
                  {isPending ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : <PlayIcon data-icon="inline-start" />}
                  Queue manual run
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">You do not have permission to queue runs.</p>
              )}
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

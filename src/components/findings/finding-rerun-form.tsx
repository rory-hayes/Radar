"use client";

import { useActionState } from "react";
import { AlertCircleIcon, CheckCircle2Icon, LockIcon, RotateCcwIcon } from "lucide-react";

import { queueFindingRerunAction, type FindingRerunState } from "@/app/(app)/findings/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";

type FindingRerunFormProps = {
  findingId: string;
  canRun: boolean;
};

const initialState: FindingRerunState = {};

export function FindingRerunForm({ findingId, canRun }: FindingRerunFormProps) {
  const [state, formAction, isPending] = useActionState(queueFindingRerunAction, initialState);
  const isDisabled = isPending || !canRun;

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>Fix validation</CardTitle>
        <CardDescription>Queue a linked rerun after the recommended fix has been applied.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} id={`finding-rerun-${findingId}`}>
          <input type="hidden" name="findingId" value={findingId} />
          <FieldGroup>
            {!canRun ? (
              <Alert>
                <LockIcon />
                <AlertTitle>Run permission required</AlertTitle>
                <AlertDescription>Only workspace admins and editors can queue validation reruns.</AlertDescription>
              </Alert>
            ) : null}
            {state.error ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Rerun not queued</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
            {state.success ? (
              <Alert>
                <CheckCircle2Icon />
                <AlertTitle>Rerun queued</AlertTitle>
                <AlertDescription>{state.success}</AlertDescription>
              </Alert>
            ) : null}
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="submit" form={`finding-rerun-${findingId}`} disabled={isDisabled}>
          <RotateCcwIcon data-icon="inline-start" />
          {isPending ? "Queueing" : "Validate fix"}
        </Button>
      </CardFooter>
    </Card>
  );
}

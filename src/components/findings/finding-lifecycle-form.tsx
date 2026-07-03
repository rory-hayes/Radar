"use client";

import { useActionState, useId } from "react";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  LockIcon,
  SaveIcon,
} from "lucide-react";

import {
  updateFindingLifecycleAction,
  type FindingLifecycleState,
} from "@/app/(app)/findings/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { FindingStatus } from "@/lib/findings/schema";

type FindingLifecycleFormProps = {
  findingId: string;
  currentStatus: FindingStatus;
  allowedStatuses: readonly FindingStatus[];
  canResolve: boolean;
};

const initialState: FindingLifecycleState = {};

export function FindingLifecycleForm({
  findingId,
  currentStatus,
  allowedStatuses,
  canResolve,
}: FindingLifecycleFormProps) {
  const noteId = useId();
  const statusId = useId();
  const [state, formAction, isPending] = useActionState(updateFindingLifecycleAction, initialState);
  const isDisabled = isPending || !canResolve || allowedStatuses.length === 0;

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>Lifecycle</CardTitle>
        <CardDescription>Move this finding through the controlled resolution workflow.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} id={`finding-lifecycle-${findingId}`}>
          <input type="hidden" name="findingId" value={findingId} />
          <FieldGroup>
            {!canResolve ? (
              <Alert>
                <LockIcon />
                <AlertTitle>Editor permission required</AlertTitle>
                <AlertDescription>Only workspace admins and editors can change finding status.</AlertDescription>
              </Alert>
            ) : null}
            {state.error ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Status not updated</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
            {state.success ? (
              <Alert>
                <CheckCircle2Icon />
                <AlertTitle>Status updated</AlertTitle>
                <AlertDescription>{state.success}</AlertDescription>
              </Alert>
            ) : null}
            <Field>
              <FieldLabel htmlFor={statusId}>Move to</FieldLabel>
              <Select
                name="status"
                defaultValue={allowedStatuses[0] ?? currentStatus}
                disabled={isDisabled}
              >
                <SelectTrigger id={statusId} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {allowedStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatStatus(status)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>Current status: {formatStatus(currentStatus)}.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={noteId}>Lifecycle note</FieldLabel>
              <Textarea
                id={noteId}
                name="note"
                maxLength={1000}
                disabled={isDisabled}
                placeholder="Summarize the fix, reason for ignoring, or false-positive decision."
              />
              <FieldDescription>Required when resolving, ignoring, or marking false positive.</FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          type="submit"
          form={`finding-lifecycle-${findingId}`}
          disabled={isDisabled}
        >
          <SaveIcon data-icon="inline-start" />
          {isPending ? "Updating" : "Update status"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function formatStatus(status: FindingStatus) {
  return status
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

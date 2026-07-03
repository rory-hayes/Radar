"use client";

import { useActionState } from "react";
import { AlertCircleIcon, LockIcon, Trash2Icon } from "lucide-react";

import { deleteSourceAction } from "@/app/(app)/sources/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type SourceDeletePanelProps = {
  sourceId: string;
  sourceName: string;
  linkedAssertionCount: number;
  canDelete: boolean;
};

const initialState: Awaited<ReturnType<typeof deleteSourceAction>> = {};

export function SourceDeletePanel({
  sourceId,
  sourceName,
  linkedAssertionCount,
  canDelete,
}: SourceDeletePanelProps) {
  const [state, formAction, isPending] = useActionState(deleteSourceAction, initialState);
  const isDisabled = !canDelete || isPending;

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>Delete source data</CardTitle>
        <CardDescription>Remove this source, extracted records, chunks, links, and uploaded artifacts.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} id="source-delete-form">
          <FieldGroup>
            {!canDelete ? (
              <Alert>
                <LockIcon />
                <AlertTitle>Admin permission required</AlertTitle>
                <AlertDescription>Only workspace admins can delete source data.</AlertDescription>
              </Alert>
            ) : null}
            {linkedAssertionCount > 0 ? (
              <Alert>
                <AlertCircleIcon />
                <AlertTitle>Assertions depend on this source</AlertTitle>
                <AlertDescription>
                  Deleting it will remove source links from {linkedAssertionCount} assertion
                  {linkedAssertionCount === 1 ? "" : "s"}.
                </AlertDescription>
              </Alert>
            ) : null}
            {state.error ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Source not deleted</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
            <input type="hidden" name="sourceId" value={sourceId} />
            <Field>
              <FieldLabel htmlFor="source-delete-confirmation">Confirm source name</FieldLabel>
              <Input
                id="source-delete-confirmation"
                name="confirmationName"
                placeholder={sourceName}
                autoComplete="off"
                disabled={isDisabled}
                required
              />
              <FieldDescription>Type {sourceName} exactly to remove stored data for this source.</FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="submit" form="source-delete-form" variant="destructive" disabled={isDisabled}>
          <Trash2Icon data-icon="inline-start" />
          {isPending ? "Deleting" : "Delete source"}
        </Button>
      </CardFooter>
    </Card>
  );
}

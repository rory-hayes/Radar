"use client";

import { useActionState } from "react";
import { AlertCircleIcon, Building2Icon } from "lucide-react";

import { createWorkspaceAction } from "@/app/(workspace)/workspace/new/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const initialState: Awaited<ReturnType<typeof createWorkspaceAction>> = {};

export function WorkspaceCreateForm() {
  const [state, formAction, isPending] = useActionState(createWorkspaceAction, initialState);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create a workspace</CardTitle>
        <CardDescription>
          This workspace will isolate every assertion, source, runner configuration, and finding.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <FieldGroup>
            {state.error ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Workspace not created</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
            <Field>
              <FieldLabel htmlFor="workspace-name">Workspace name</FieldLabel>
              <Input
                id="workspace-name"
                name="name"
                autoComplete="organization"
                placeholder="Acme Support Operations"
                minLength={2}
                maxLength={80}
                disabled={isPending}
                required
              />
              <FieldDescription>Use the company or operating team Radar will verify.</FieldDescription>
            </Field>
            <Button type="submit" disabled={isPending}>
              <Building2Icon data-icon="inline-start" />
              {isPending ? "Creating workspace" : "Create workspace"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

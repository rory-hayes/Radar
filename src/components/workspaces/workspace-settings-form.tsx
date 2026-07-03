"use client";

import { useActionState } from "react";
import { AlertCircleIcon, CheckCircle2Icon, LockIcon, SaveIcon } from "lucide-react";

import { updateWorkspaceSettingsAction } from "@/app/(app)/settings/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type RadarWorkspace } from "@/lib/workspaces/schema";

type WorkspaceSettingsFormProps = {
  workspace: RadarWorkspace;
  canManage: boolean;
};

const initialState: Awaited<ReturnType<typeof updateWorkspaceSettingsAction>> = {};

export function WorkspaceSettingsForm({ workspace, canManage }: WorkspaceSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateWorkspaceSettingsAction, initialState);
  const isDisabled = !canManage || isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace profile</CardTitle>
        <CardDescription>Keep the tenant identity simple and recognizable for assertion owners.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} id="workspace-settings-form">
          <FieldGroup>
            {!canManage ? (
              <Alert>
                <LockIcon />
                <AlertTitle>Admin permission required</AlertTitle>
                <AlertDescription>Only workspace admins can update these settings.</AlertDescription>
              </Alert>
            ) : null}
            {state.error ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Settings not saved</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
            {state.success ? (
              <Alert>
                <CheckCircle2Icon />
                <AlertTitle>Settings saved</AlertTitle>
                <AlertDescription>{state.success}</AlertDescription>
              </Alert>
            ) : null}
            <Field>
              <FieldLabel htmlFor="workspace-name">Workspace name</FieldLabel>
              <Input
                id="workspace-name"
                name="name"
                defaultValue={workspace.name}
                autoComplete="organization"
                minLength={2}
                maxLength={80}
                disabled={isDisabled}
                required
              />
              <FieldDescription>The company or operating team Radar verifies.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="workspace-slug">Workspace slug</FieldLabel>
              <Input
                id="workspace-slug"
                name="slug"
                defaultValue={workspace.slug}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                minLength={2}
                maxLength={80}
                disabled={isDisabled}
                required
              />
              <FieldDescription>Lowercase letters, numbers, and single hyphens only.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="team-visibility">Team visibility</FieldLabel>
              <Select name="teamVisibility" defaultValue={workspace.teamVisibility} disabled={isDisabled}>
                <SelectTrigger id="team-visibility" className="w-full">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="private">Private to admins</SelectItem>
                    <SelectItem value="workspace">Visible to workspace members</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>Controls how broadly the workspace profile appears inside Radar.</FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="submit" form="workspace-settings-form" disabled={isDisabled}>
          <SaveIcon data-icon="inline-start" />
          {isPending ? "Saving" : "Save settings"}
        </Button>
      </CardFooter>
    </Card>
  );
}

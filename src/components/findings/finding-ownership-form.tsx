"use client";

import { useActionState, useId } from "react";
import { AlertCircleIcon, CheckCircle2Icon, LockIcon, SaveIcon } from "lucide-react";

import {
  updateFindingOwnershipAction,
  type FindingOwnershipState,
} from "@/app/(app)/findings/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  findingOwnerTeams,
  findingSeverities,
  type FindingOwnerTeam,
  type FindingSeverity,
} from "@/lib/findings/schema";

export type FindingOwnerOption = {
  value: string;
  label: string;
};

type FindingOwnershipFormProps = {
  findingId: string;
  ownerUserId?: string;
  ownerTeam?: FindingOwnerTeam;
  severity: FindingSeverity;
  ownerOptions: readonly FindingOwnerOption[];
  canManage: boolean;
};

const initialState: FindingOwnershipState = {};
const noOwnerValue = "unassigned";

export function FindingOwnershipForm({
  findingId,
  ownerUserId,
  ownerTeam,
  severity,
  ownerOptions,
  canManage,
}: FindingOwnershipFormProps) {
  const ownerId = useId();
  const teamId = useId();
  const severityId = useId();
  const noteId = useId();
  const [state, formAction, isPending] = useActionState(updateFindingOwnershipAction, initialState);
  const isDisabled = isPending || !canManage;

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>Ownership</CardTitle>
        <CardDescription>Assign the operational owner, team, and priority for follow-up.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} id={`finding-ownership-${findingId}`}>
          <input type="hidden" name="findingId" value={findingId} />
          <FieldGroup>
            {!canManage ? (
              <Alert>
                <LockIcon />
                <AlertTitle>Editor permission required</AlertTitle>
                <AlertDescription>Only workspace admins and editors can update ownership.</AlertDescription>
              </Alert>
            ) : null}
            {state.error ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Ownership not updated</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
            {state.success ? (
              <Alert>
                <CheckCircle2Icon />
                <AlertTitle>Ownership updated</AlertTitle>
                <AlertDescription>{state.success}</AlertDescription>
              </Alert>
            ) : null}
            <Field>
              <FieldLabel htmlFor={ownerId}>Owner</FieldLabel>
              <Select name="ownerUserId" defaultValue={ownerUserId ?? noOwnerValue} disabled={isDisabled}>
                <SelectTrigger id={ownerId} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={noOwnerValue}>Unassigned</SelectItem>
                    {ownerOptions.map((owner) => (
                      <SelectItem key={owner.value} value={owner.value}>
                        {owner.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>Owners must be active members of this workspace.</FieldDescription>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={teamId}>Team</FieldLabel>
                <Select name="ownerTeam" defaultValue={ownerTeam ?? "ops"} disabled={isDisabled}>
                  <SelectTrigger id={teamId} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {findingOwnerTeams.map((team) => (
                        <SelectItem key={team} value={team}>
                          {formatOwnerTeam(team)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor={severityId}>Priority</FieldLabel>
                <Select name="severity" defaultValue={severity} disabled={isDisabled}>
                  <SelectTrigger id={severityId} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {findingSeverities.map((findingSeverity) => (
                        <SelectItem key={findingSeverity} value={findingSeverity}>
                          {formatSeverity(findingSeverity)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor={noteId}>Assignment note</FieldLabel>
              <Textarea
                id={noteId}
                name="note"
                maxLength={1000}
                disabled={isDisabled}
                placeholder="Add context for the assigned team."
              />
              <FieldDescription>Stored in finding activity for handoff context.</FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="submit" form={`finding-ownership-${findingId}`} disabled={isDisabled}>
          <SaveIcon data-icon="inline-start" />
          {isPending ? "Updating" : "Update ownership"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function formatOwnerTeam(team: FindingOwnerTeam) {
  return team === "ops" ? "Ops" : `${team.charAt(0).toUpperCase()}${team.slice(1)}`;
}

function formatSeverity(severity: FindingSeverity) {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { AlertCircleIcon, LoaderCircleIcon, SaveIcon } from "lucide-react";

import {
  createAssertionAction,
  updateAssertionAction,
  type AssertionFormState,
} from "@/app/(app)/assertions/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  assertionCategories,
  assertionPriorities,
  assertionScheduleCadences,
  assertionStatuses,
  runnerTypes,
  type RadarAssertion,
} from "@/lib/assertions/schema";
import type { RadarAssertionRunSchedule } from "@/lib/repositories";
import type { RadarSource } from "@/lib/sources/schema";

type AssertionFormMode = "create" | "edit";

type AssertionFormProps = {
  mode: AssertionFormMode;
  assertion?: RadarAssertion;
  schedule?: RadarAssertionRunSchedule;
  sources: readonly Pick<RadarSource, "id" | "name" | "type" | "syncStatus">[];
  linkedSourceIds?: readonly string[];
};

const initialState: AssertionFormState = {};

export function AssertionForm({
  mode,
  assertion,
  schedule,
  sources,
  linkedSourceIds = [],
}: AssertionFormProps) {
  const action = mode === "create" ? createAssertionAction : updateAssertionAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const titleId = useId();
  const purposeId = useId();
  const expectedBehaviorId = useId();
  const categoryId = useId();
  const priorityId = useId();
  const runnerTypeId = useId();
  const statusId = useId();
  const ownerId = useId();
  const cadenceId = useId();
  const timezoneId = useId();
  const isEdit = mode === "edit";
  const selectedSourceIds = new Set(linkedSourceIds);

  return (
    <Card className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>{isEdit ? "Edit assertion" : "Create assertion"}</CardTitle>
        <CardDescription>
          Define the customer-facing business truth first, then attach only the evidence sources needed to verify it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} id="assertion-form">
          {assertion?.id ? <input type="hidden" name="assertionId" value={assertion.id} /> : null}
          <FieldGroup>
            {state.error ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Assertion not saved</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
            <Field data-disabled={isPending ? true : undefined}>
              <FieldLabel htmlFor={titleId}>Assertion name</FieldLabel>
              <Input
                id={titleId}
                name="title"
                defaultValue={assertion?.title}
                placeholder="Pricing answers match the current pricing page"
                minLength={4}
                maxLength={180}
                disabled={isPending}
                required
              />
              <FieldDescription>Name the business truth in customer-facing language.</FieldDescription>
            </Field>
            <Field data-disabled={isPending ? true : undefined}>
              <FieldLabel htmlFor={purposeId}>Purpose</FieldLabel>
              <Textarea
                id={purposeId}
                name="purpose"
                defaultValue={assertion?.purpose}
                placeholder="Verify that customers receive the correct plan limits, pricing, and billing escalation guidance."
                minLength={8}
                maxLength={1000}
                disabled={isPending}
                required
              />
            </Field>
            <Field data-disabled={isPending ? true : undefined}>
              <FieldLabel htmlFor={expectedBehaviorId}>Expected behaviour</FieldLabel>
              <Textarea
                id={expectedBehaviorId}
                name="expectedBehavior"
                defaultValue={assertion?.expectedBehavior}
                placeholder="Support answers must match the current pricing page and route exceptions to a human owner."
                minLength={8}
                maxLength={2000}
                disabled={isPending}
                required
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                id={categoryId}
                name="category"
                label="Category"
                defaultValue={assertion?.category ?? "custom"}
                values={assertionCategories}
                disabled={isPending}
                format={formatAssertionValue}
              />
              <SelectField
                id={priorityId}
                name="priority"
                label="Priority"
                defaultValue={assertion?.priority ?? "medium"}
                values={assertionPriorities}
                disabled={isPending}
                format={formatAssertionValue}
              />
              <SelectField
                id={runnerTypeId}
                name="runnerType"
                label="Runner type"
                defaultValue={assertion?.runnerType ?? "knowledge"}
                values={runnerTypes}
                disabled={isPending}
                format={(value) => `${formatAssertionValue(value)} Runner`}
              />
              <SelectField
                id={statusId}
                name="status"
                label="Status"
                defaultValue={assertion?.status ?? "active"}
                values={assertionStatuses}
                disabled={isPending}
                format={formatAssertionValue}
              />
            </div>
            <Field data-disabled={isPending ? true : undefined}>
              <FieldLabel htmlFor={ownerId}>Owner user id</FieldLabel>
              <Input
                id={ownerId}
                name="ownerUserId"
                defaultValue={assertion?.ownerUserId}
                placeholder="Optional user id"
                disabled={isPending}
              />
              <FieldDescription>Leave blank until a specific owner is needed.</FieldDescription>
            </Field>
            <FieldSet>
              <FieldLegend>Schedule</FieldLegend>
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  id={cadenceId}
                  name="scheduleCadence"
                  label="Cadence"
                  defaultValue={schedule?.cadence ?? "manual"}
                  values={assertionScheduleCadences}
                  disabled={isPending}
                  format={formatAssertionValue}
                />
                <Field data-disabled={isPending ? true : undefined}>
                  <FieldLabel htmlFor={timezoneId}>Timezone</FieldLabel>
                  <Input
                    id={timezoneId}
                    name="timezone"
                    defaultValue={schedule?.timezone ?? "UTC"}
                    maxLength={80}
                    disabled={isPending}
                    required
                  />
                </Field>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <CheckboxField
                  name="scheduleEnabled"
                  label="Enable scheduled runs"
                  description="Queue this assertion from its cadence once run orchestration is available."
                  defaultChecked={schedule?.isEnabled ?? false}
                  disabled={isPending}
                />
                <CheckboxField
                  name="sourceChangeTrigger"
                  label="Rerun when linked sources change"
                  description="Keep this assertion responsive to changed evidence sources."
                  defaultChecked={schedule?.sourceChangeTrigger ?? true}
                  disabled={isPending}
                />
              </div>
            </FieldSet>
            <FieldSet>
              <FieldLegend>Evidence sources</FieldLegend>
              <FieldDescription>
                Attach the minimum sources needed for this assertion. More can be added later.
              </FieldDescription>
              <div className="grid gap-2 md:grid-cols-2">
                {sources.length > 0 ? (
                  sources.map((source) => (
                    <CheckboxField
                      key={source.id}
                      name="sourceIds"
                      value={source.id}
                      label={source.name}
                      description={`${formatAssertionValue(source.type)} · ${formatAssertionValue(source.syncStatus)}`}
                      defaultChecked={selectedSourceIds.has(source.id)}
                      disabled={isPending}
                    />
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    No sources are connected yet. Save the assertion now and attach evidence after adding sources.
                  </p>
                )}
              </div>
            </FieldSet>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button asChild variant="outline" disabled={isPending}>
          <Link href="/assertions">Cancel</Link>
        </Button>
        <Button type="submit" form="assertion-form" disabled={isPending}>
          {isPending ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : <SaveIcon data-icon="inline-start" />}
          {isPending ? "Saving assertion" : "Save assertion"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function SelectField<TValue extends string>({
  id,
  name,
  label,
  defaultValue,
  values,
  disabled,
  format,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: TValue;
  values: readonly TValue[];
  disabled: boolean;
  format: (value: TValue) => string;
}) {
  return (
    <Field data-disabled={disabled ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select name={name} defaultValue={defaultValue} disabled={disabled}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {values.map((value) => (
              <SelectItem key={value} value={value}>
                {format(value)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}

function CheckboxField({
  name,
  value = "on",
  label,
  description,
  defaultChecked,
  disabled,
}: {
  name: string;
  value?: string;
  label: string;
  description: string;
  defaultChecked: boolean;
  disabled: boolean;
}) {
  return (
    <label className="flex gap-3 rounded-lg border bg-background p-3 text-sm">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="mt-1 size-4 rounded border-input"
      />
      <span className="flex min-w-0 flex-col gap-1">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

function formatAssertionValue(value: string) {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

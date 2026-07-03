"use client";

import { useActionState } from "react";
import { AlertCircleIcon, CheckCircle2Icon, LoaderCircleIcon, SaveIcon } from "lucide-react";

import {
  updateAssertionSourceLinksAction,
  type AssertionSourceLinkingState,
} from "@/app/(app)/assertions/actions";
import { StatusBadge } from "@/components/radar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import {
  getAssertionSourceCoverage,
  isAssertionSourceCoverageMet,
} from "@/lib/assertions/source-coverage";
import type { RadarAssertion } from "@/lib/assertions/schema";
import type { RadarSource, SourceType } from "@/lib/sources/schema";

type SourceLinkingSource = Pick<RadarSource, "id" | "name" | "description" | "type" | "syncStatus">;

type AssertionSourceLinkingPanelProps = {
  assertion: RadarAssertion;
  availableSources: readonly SourceLinkingSource[];
  linkedSources: readonly SourceLinkingSource[];
  canEdit: boolean;
};

const initialState: AssertionSourceLinkingState = {};

export function AssertionSourceLinkingPanel({
  assertion,
  availableSources,
  linkedSources,
  canEdit,
}: AssertionSourceLinkingPanelProps) {
  const [state, formAction, isPending] = useActionState(updateAssertionSourceLinksAction, initialState);
  const linkedSourceIds = new Set(linkedSources.map((source) => source.id));
  const coverage = getAssertionSourceCoverage(assertion, linkedSources);
  const coverageMet = isAssertionSourceCoverageMet(coverage);
  const isDisabled = isPending || !canEdit;

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>Minimum source coverage</CardTitle>
        <CardDescription>
          Attach only the sources this assertion needs before Radar runs evidence-backed checks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <input type="hidden" name="assertionId" value={assertion.id} />
          <FieldGroup>
            {state.error ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Sources not updated</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
            {state.success ? (
              <Alert>
                <CheckCircle2Icon />
                <AlertTitle>Sources updated</AlertTitle>
                <AlertDescription>{state.success}</AlertDescription>
              </Alert>
            ) : null}
            <div className="grid gap-3 lg:grid-cols-2">
              {coverage.map((requirement) => (
                <div key={requirement.id} className="flex flex-col gap-2 rounded-md border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-foreground">{requirement.label}</span>
                    <StatusBadge
                      tone={requirement.isMet ? "pass" : "warning"}
                      label={requirement.isMet ? "Covered" : "Needs source"}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">{requirement.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Accepts {requirement.acceptableTypes.map(formatSourceType).join(", ")}.
                  </p>
                </div>
              ))}
            </div>
            <FieldSet>
              <FieldLegend>Assertion sources</FieldLegend>
              <FieldDescription>
                {coverageMet
                  ? "Current links satisfy the minimum coverage for this runner."
                  : "Select at least one source that satisfies the required coverage above."}
              </FieldDescription>
              <div className="grid gap-2 md:grid-cols-2">
                {availableSources.length > 0 ? (
                  availableSources.map((source) => (
                    <Field
                      key={source.id}
                      data-disabled={isDisabled ? true : undefined}
                      className="flex flex-row items-start gap-3 rounded-md border bg-background p-3"
                    >
                      <input
                        type="checkbox"
                        name="sourceIds"
                        value={source.id}
                        defaultChecked={linkedSourceIds.has(source.id)}
                        disabled={isDisabled}
                        className="mt-1 size-4 rounded border-input"
                      />
                      <div className="flex min-w-0 flex-col gap-1">
                        <FieldLabel className="font-medium">{source.name}</FieldLabel>
                        <FieldDescription>
                          {formatSourceType(source.type)} / {formatSourceSyncStatus(source.syncStatus)}
                        </FieldDescription>
                        {source.description ? (
                          <p className="line-clamp-2 text-sm text-muted-foreground">{source.description}</p>
                        ) : null}
                      </div>
                    </Field>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    No sources are connected yet. Add a source before linking evidence to this assertion.
                  </p>
                )}
              </div>
            </FieldSet>
            {canEdit ? (
              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  {isPending ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : <SaveIcon data-icon="inline-start" />}
                  Save source links
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Viewers can inspect source coverage but cannot change links.</p>
            )}
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

function formatSourceType(type: SourceType) {
  const labels: Record<SourceType, string> = {
    url: "URL",
    uploaded_document: "Uploaded document",
    manual_text: "Manual text",
    api_endpoint: "API endpoint",
    support_bot_endpoint: "Support bot endpoint",
  };

  return labels[type];
}

function formatSourceSyncStatus(status: RadarSource["syncStatus"]) {
  return status
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

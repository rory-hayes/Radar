"use client";

import { useActionState } from "react";
import { AlertCircleIcon, LoaderCircleIcon, SparklesIcon } from "lucide-react";

import {
  generateSuggestedAssertionDraftsAction,
  type AssertionSuggestionState,
} from "@/app/(app)/assertions/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { RadarSource, SourceType } from "@/lib/sources/schema";

type AssertionSuggestionGeneratorProps = {
  sources: readonly Pick<RadarSource, "id" | "name" | "description" | "type" | "syncStatus">[];
};

const initialState: AssertionSuggestionState = {};

export function AssertionSuggestionGenerator({ sources }: AssertionSuggestionGeneratorProps) {
  const [state, formAction, isPending] = useActionState(generateSuggestedAssertionDraftsAction, initialState);
  const hasSources = sources.length > 0;

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>Suggest assertions from sources</CardTitle>
        <CardDescription>
          Generate draft assertions from selected source evidence. Drafts must be reviewed before activation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <FieldGroup>
            {state.error ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Suggestions not generated</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
            <FieldSet>
              <FieldLegend>Source context</FieldLegend>
              <FieldDescription>Select up to five sources Radar should use for draft suggestions.</FieldDescription>
              <div className="grid gap-2 md:grid-cols-2">
                {hasSources ? (
                  sources.map((source) => (
                    <Field
                      key={source.id}
                      data-disabled={isPending ? true : undefined}
                      orientation="horizontal"
                      className="rounded-md border bg-background p-3"
                    >
                      <Checkbox
                        id={`suggestion-source-${source.id}`}
                        name="sourceIds"
                        value={source.id}
                        disabled={isPending}
                      />
                      <FieldContent>
                        <FieldLabel htmlFor={`suggestion-source-${source.id}`} className="font-medium">
                          {source.name}
                        </FieldLabel>
                        <FieldDescription>
                          {formatSourceType(source.type)} / {formatSourceSyncStatus(source.syncStatus)}
                        </FieldDescription>
                        {source.description ? (
                          <p className="line-clamp-2 text-sm text-muted-foreground">{source.description}</p>
                        ) : null}
                      </FieldContent>
                    </Field>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    Add and sync sources before generating assertion suggestions.
                  </p>
                )}
              </div>
            </FieldSet>
            <div className="grid gap-3 md:grid-cols-[12rem_1fr]">
              <Field data-disabled={isPending || !hasSources ? true : undefined}>
                <FieldLabel htmlFor="maxSuggestions">Draft count</FieldLabel>
                <Input
                  id="maxSuggestions"
                  name="maxSuggestions"
                  type="number"
                  min={1}
                  max={5}
                  defaultValue={3}
                  disabled={isPending || !hasSources}
                />
              </Field>
              <div className="flex items-end justify-end">
                <Button type="submit" disabled={isPending || !hasSources}>
                  {isPending ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : <SparklesIcon data-icon="inline-start" />}
                  Generate draft assertions
                </Button>
              </div>
            </div>
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

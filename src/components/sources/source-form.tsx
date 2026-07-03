"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { AlertCircleIcon, LoaderCircleIcon, SaveIcon } from "lucide-react";

import {
  createSourceAction,
  updateSourceAction,
  type SourceFormState,
} from "@/app/(app)/sources/actions";
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
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
import { type RadarSource, type SourceType } from "@/lib/sources/schema";

type SourceFormMode = "create" | "edit";

type SourceFormSource = Pick<RadarSource, "id" | "name" | "description" | "type" | "originUri">;

type SourceFormProps = {
  mode: SourceFormMode;
  source?: SourceFormSource;
};

const initialState: SourceFormState = {};

const sourceTypeOptions: ReadonlyArray<{
  value: SourceType;
  label: string;
  description: string;
}> = [
  {
    value: "url",
    label: "URL",
    description: "Docs, pricing pages, help center articles, or policies.",
  },
  {
    value: "uploaded_document",
    label: "Uploaded document",
    description: "PDF, Markdown, TXT, or policy files.",
  },
  {
    value: "manual_text",
    label: "Manual text",
    description: "Short policy excerpts maintained directly in Radar.",
  },
  {
    value: "api_endpoint",
    label: "API endpoint",
    description: "Generic HTTP checks for Integration Runner assertions.",
  },
  {
    value: "support_bot_endpoint",
    label: "Support bot endpoint",
    description: "AI support or answer endpoints for Knowledge Runner checks.",
  },
];

const endpointMethodOptions = ["GET", "POST"] as const;
const endpointAuthModeOptions = [
  { value: "none", label: "No auth" },
  { value: "bearer", label: "Bearer credential configured later" },
  { value: "basic", label: "Basic auth configured later" },
  { value: "custom_header", label: "Custom header configured later" },
] as const;

export function SourceForm({ mode, source }: SourceFormProps) {
  const action = mode === "create" ? createSourceAction : updateSourceAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [selectedType, setSelectedType] = useState<SourceType>(source?.type ?? "url");
  const sourceTypeId = useId();
  const nameId = useId();
  const descriptionId = useId();
  const originUriId = useId();
  const manualTextId = useId();
  const uploadedFileId = useId();
  const endpointMethodId = useId();
  const endpointAuthModeId = useId();
  const isEdit = mode === "edit";

  return (
    <Card className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>{isEdit ? "Edit source" : "Add source"}</CardTitle>
        <CardDescription>
          Add only the evidence input required by an active customer-facing assertion.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} id="source-form" encType="multipart/form-data">
          {source?.id ? <input type="hidden" name="sourceId" value={source.id} /> : null}
          {isEdit ? <input type="hidden" name="type" value={selectedType} /> : null}
          <FieldGroup>
            {state.error ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Source not saved</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
            <Field data-disabled={isPending ? true : undefined}>
              <FieldLabel htmlFor={nameId}>Source name</FieldLabel>
              <Input
                id={nameId}
                name="name"
                defaultValue={source?.name}
                placeholder="Pricing page"
                minLength={2}
                maxLength={140}
                disabled={isPending}
                required
              />
              <FieldDescription>Name the evidence source in business terms.</FieldDescription>
            </Field>
            <Field data-disabled={isPending ? true : undefined}>
              <FieldLabel htmlFor={descriptionId}>Description</FieldLabel>
              <Textarea
                id={descriptionId}
                name="description"
                defaultValue={source?.description}
                placeholder="Used by Pricing & Plan Accuracy assertions."
                maxLength={500}
                disabled={isPending}
              />
            </Field>
            <Field data-disabled={isPending || isEdit ? true : undefined}>
              <FieldLabel htmlFor={sourceTypeId}>Source type</FieldLabel>
              {isEdit ? (
                <Input id={sourceTypeId} value={sourceTypeLabel(selectedType)} disabled readOnly />
              ) : (
                <Select
                  name="type"
                  value={selectedType}
                  onValueChange={(value) => setSelectedType(value as SourceType)}
                  disabled={isPending}
                >
                  <SelectTrigger id={sourceTypeId} className="w-full">
                    <SelectValue placeholder="Select source type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {sourceTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
              <FieldDescription>{sourceTypeDescription(selectedType)}</FieldDescription>
            </Field>
            {selectedType === "url" ? (
              <SourceUrlField
                id={originUriId}
                label="Source URL"
                description="Use the canonical customer-facing page Radar should verify against."
                defaultValue={source?.originUri}
                disabled={isPending}
                required
              />
            ) : null}
            {selectedType === "uploaded_document" ? (
              <>
                <Field data-disabled={isPending ? true : undefined}>
                  <FieldLabel htmlFor={uploadedFileId}>Document file</FieldLabel>
                  <Input
                    id={uploadedFileId}
                    name="uploadedFile"
                    type="file"
                    accept=".pdf,.md,.txt,text/markdown,text/plain,application/pdf"
                    disabled={isPending}
                  />
                  <FieldDescription>
                    Attach a source file or use the reference field below for an externally hosted document.
                  </FieldDescription>
                </Field>
                <SourceUrlField
                  id={originUriId}
                  label="Document reference"
                  description="Optional URL for the original document, policy, or source-of-truth location."
                  defaultValue={source?.originUri}
                  disabled={isPending}
                />
              </>
            ) : null}
            {selectedType === "manual_text" ? (
              <Field data-disabled={isPending ? true : undefined}>
                <FieldLabel htmlFor={manualTextId}>Manual source text</FieldLabel>
                <Textarea
                  id={manualTextId}
                  name="manualText"
                  placeholder="Paste the current customer-facing policy or operating rule."
                  minLength={isEdit ? undefined : 20}
                  maxLength={50000}
                  disabled={isPending}
                  required={!isEdit}
                />
                <FieldDescription>
                  On edit, leave this blank unless replacing the stored source text.
                </FieldDescription>
              </Field>
            ) : null}
            {selectedType === "api_endpoint" || selectedType === "support_bot_endpoint" ? (
              <>
                <SourceUrlField
                  id={originUriId}
                  label={selectedType === "api_endpoint" ? "Endpoint URL" : "Support bot endpoint URL"}
                  description="Use an http or https endpoint. Store credentials outside this form."
                  defaultValue={source?.originUri}
                  disabled={isPending}
                  required
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field data-disabled={isPending ? true : undefined}>
                    <FieldLabel htmlFor={endpointMethodId}>HTTP method</FieldLabel>
                    <Select name="endpointMethod" defaultValue="GET" disabled={isPending}>
                      <SelectTrigger id={endpointMethodId} className="w-full">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {endpointMethodOptions.map((method) => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field data-disabled={isPending ? true : undefined}>
                    <FieldLabel htmlFor={endpointAuthModeId}>Credential mode</FieldLabel>
                    <Select name="endpointAuthMode" defaultValue="none" disabled={isPending}>
                      <SelectTrigger id={endpointAuthModeId} className="w-full">
                        <SelectValue placeholder="Select credential mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {endpointAuthModeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </>
            ) : null}
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button asChild variant="outline" disabled={isPending}>
          <Link href="/sources">Cancel</Link>
        </Button>
        <Button type="submit" form="source-form" disabled={isPending}>
          {isPending ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : <SaveIcon data-icon="inline-start" />}
          {isPending ? "Saving source" : "Save source"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function SourceUrlField({
  id,
  label,
  description,
  defaultValue,
  disabled,
  required,
}: {
  id: string;
  label: string;
  description: string;
  defaultValue?: string;
  disabled: boolean;
  required?: boolean;
}) {
  return (
    <Field data-disabled={disabled ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        name="originUri"
        type="url"
        defaultValue={defaultValue}
        placeholder="https://example.com/pricing"
        maxLength={2048}
        disabled={disabled}
        required={required}
      />
      <FieldDescription>{description}</FieldDescription>
    </Field>
  );
}

function sourceTypeLabel(type: SourceType) {
  return sourceTypeOptions.find((option) => option.value === type)?.label ?? "Source";
}

function sourceTypeDescription(type: SourceType) {
  return sourceTypeOptions.find((option) => option.value === type)?.description ?? "";
}

import Link from "next/link";
import { CheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  v1AssertionTemplates,
  type V1AssertionPackSlug,
  type V1AssertionTemplate,
} from "@/lib/assertions/templates";
import type { SourceType } from "@/lib/sources/schema";

type AssertionTemplatePickerProps = {
  selectedSlug?: V1AssertionPackSlug;
};

export function AssertionTemplatePicker({ selectedSlug }: AssertionTemplatePickerProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground">Start from a V1 assertion pack</h2>
        <p className="text-sm text-muted-foreground">
          Choose a business-focused starting point, then edit the assertion before saving.
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-5">
        {v1AssertionTemplates.map((template) => (
          <AssertionTemplateCard
            key={template.slug}
            template={template}
            isSelected={template.slug === selectedSlug}
          />
        ))}
      </div>
    </section>
  );
}

function AssertionTemplateCard({
  template,
  isSelected,
}: {
  template: V1AssertionTemplate;
  isSelected: boolean;
}) {
  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{template.name}</CardTitle>
          {isSelected ? (
            <Badge variant="outline">
              <CheckIcon data-icon="inline-start" />
              Selected
            </Badge>
          ) : null}
        </div>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{formatRunnerType(template.runnerType)}</Badge>
          <Badge variant="outline">{formatPriority(template.priority)}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Sources: {template.requiredSourceTypes.map(formatSourceType).join(", ")}
        </p>
        <Button asChild variant={isSelected ? "default" : "outline"} size="sm">
          <Link href={`/assertions/new?template=${template.slug}`}>
            {isSelected ? "Using pack" : "Use pack"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function formatRunnerType(runnerType: V1AssertionTemplate["runnerType"]) {
  return `${titleize(runnerType)} Runner`;
}

function formatPriority(priority: V1AssertionTemplate["priority"]) {
  return titleize(priority);
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

function titleize(value: string) {
  return value
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

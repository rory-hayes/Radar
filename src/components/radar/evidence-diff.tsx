import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EvidenceDiffProps = {
  title: string;
  sourceLabel: string;
  sourceText: string;
  actualText: string;
  citation?: string;
  confidenceLabel?: string;
};

const stopWords = new Set([
  "about",
  "after",
  "also",
  "and",
  "are",
  "but",
  "can",
  "for",
  "from",
  "has",
  "have",
  "into",
  "not",
  "should",
  "that",
  "the",
  "this",
  "with",
  "you",
  "your",
]);

export function EvidenceDiff({
  title,
  sourceLabel,
  sourceText,
  actualText,
  citation,
  confidenceLabel,
}: EvidenceDiffProps) {
  const sourceTokens = contentTokenSet(sourceText);
  const actualTokens = contentTokenSet(actualText);

  return (
    <Card size="sm" className="rounded-lg border-border/80">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <CardDescription>{sourceLabel}</CardDescription>
        <div className="flex flex-wrap gap-2 pt-1">
          {citation ? <Badge variant="outline">{citation}</Badge> : null}
          {confidenceLabel ? <Badge variant="secondary">{confidenceLabel}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        <DiffBlock
          label="Source / policy excerpt"
          value={sourceText}
          referenceTokens={actualTokens}
          tone="missing"
        />
        <DiffBlock
          label="Actual answer or result"
          value={actualText}
          referenceTokens={sourceTokens}
          tone="mismatch"
        />
      </CardContent>
    </Card>
  );
}

function DiffBlock({
  label,
  value,
  referenceTokens,
  tone,
}: {
  label: string;
  value: string;
  referenceTokens: ReadonlySet<string>;
  tone: "missing" | "mismatch";
}) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="text-xs font-medium tracking-normal text-muted-foreground uppercase">{label}</p>
        <Badge variant="outline" className={diffToneClass(tone)}>
          {tone === "missing" ? "Missing from actual" : "Unsupported in source"}
        </Badge>
      </div>
      <p className="text-sm leading-6 text-foreground">
        {highlightText(value, referenceTokens, tone)}
      </p>
    </div>
  );
}

function highlightText(
  value: string,
  referenceTokens: ReadonlySet<string>,
  tone: "missing" | "mismatch",
) {
  return value.split(/(\b[\w'-]+\b)/g).map((part, index) => {
    const token = normalizedToken(part);

    if (!token || referenceTokens.has(token)) {
      return <span key={`${part}-${index}`}>{part}</span>;
    }

    return (
      <mark
        key={`${part}-${index}`}
        className={cn(
          "rounded-sm px-0.5 py-px text-inherit",
          tone === "missing"
            ? "bg-[var(--radar-status-warning-bg)]"
            : "bg-[var(--radar-status-fail-bg)]",
        )}
      >
        {part}
      </mark>
    );
  });
}

function contentTokenSet(value: string) {
  return new Set(
    value
      .split(/\b/)
      .map(normalizedToken)
      .filter((token): token is string => Boolean(token)),
  );
}

function normalizedToken(value: string) {
  const token = value.toLowerCase().replace(/[^a-z0-9'-]/g, "");

  if (token.length < 4 || stopWords.has(token)) {
    return undefined;
  }

  return token;
}

function diffToneClass(tone: "missing" | "mismatch") {
  return tone === "missing"
    ? "border-[color:var(--radar-status-warning-border)] bg-[var(--radar-status-warning-bg)] text-[color:var(--radar-status-warning-text)]"
    : "border-[color:var(--radar-status-fail-border)] bg-[var(--radar-status-fail-bg)] text-[color:var(--radar-status-fail-text)]";
}

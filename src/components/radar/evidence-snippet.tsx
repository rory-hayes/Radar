import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/radar/status-badge";

type EvidenceSnippetProps = {
  title: string;
  source: string;
  children: React.ReactNode;
  confidenceLabel?: string;
};

export function EvidenceSnippet({
  title,
  source,
  children,
  confidenceLabel,
}: EvidenceSnippetProps) {
  return (
    <Card size="sm" className="rounded-lg border-border/80">
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <CardDescription>{source}</CardDescription>
        {confidenceLabel ? (
          <CardAction>
            <StatusBadge tone="neutral" label={confidenceLabel} />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="border-l-2 border-radar-line-strong pl-3 text-sm leading-6 text-muted-foreground">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

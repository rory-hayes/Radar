import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge, type StatusTone } from "@/components/radar/status-badge";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: React.ReactNode;
  helperText?: string;
  tone?: StatusTone;
  statusLabel?: string;
  className?: string;
};

export function MetricCard({
  label,
  value,
  helperText,
  tone = "neutral",
  statusLabel,
  className,
}: MetricCardProps) {
  return (
    <Card
      size="sm"
      className={cn("rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]", className)}
    >
      <CardHeader className="border-b border-border/80 pb-3">
        <CardTitle className="text-sm font-semibold">{label}</CardTitle>
        {statusLabel ? (
          <CardAction>
            <StatusBadge tone={tone} label={statusLabel} />
          </CardAction>
        ) : null}
        {helperText ? <CardDescription>{helperText}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl leading-none font-semibold tracking-normal text-foreground">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

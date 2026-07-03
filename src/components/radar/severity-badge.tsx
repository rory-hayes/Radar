import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const severityTones = ["critical", "high", "medium", "low", "info"] as const;

export type SeverityTone = (typeof severityTones)[number];

type SeverityBadgeProps = Omit<React.ComponentProps<typeof Badge>, "variant"> & {
  severity?: SeverityTone;
  label?: string;
};

const severityLabels: Record<SeverityTone, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

const severityToneClasses: Record<SeverityTone, string> = {
  critical:
    "border-[color:var(--radar-severity-critical-border)] bg-[var(--radar-severity-critical-bg)] text-[color:var(--radar-severity-critical-text)]",
  high:
    "border-[color:var(--radar-severity-high-border)] bg-[var(--radar-severity-high-bg)] text-[color:var(--radar-severity-high-text)]",
  medium:
    "border-[color:var(--radar-severity-medium-border)] bg-[var(--radar-severity-medium-bg)] text-[color:var(--radar-severity-medium-text)]",
  low:
    "border-[color:var(--radar-severity-low-border)] bg-[var(--radar-severity-low-bg)] text-[color:var(--radar-severity-low-text)]",
  info:
    "border-[color:var(--radar-severity-info-border)] bg-[var(--radar-severity-info-bg)] text-[color:var(--radar-severity-info-text)]",
};

export function SeverityBadge({
  severity = "info",
  label,
  className,
  ...props
}: SeverityBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", severityToneClasses[severity], className)}
      {...props}
    >
      {label ?? severityLabels[severity]}
    </Badge>
  );
}

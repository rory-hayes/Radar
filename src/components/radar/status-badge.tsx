import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const statusTones = ["pass", "warning", "fail", "running", "neutral"] as const;

export type StatusTone = (typeof statusTones)[number];

type StatusBadgeProps = Omit<React.ComponentProps<typeof Badge>, "variant"> & {
  tone?: StatusTone;
  label?: string;
};

const statusLabels: Record<StatusTone, string> = {
  pass: "Passing",
  warning: "Warning",
  fail: "Failing",
  running: "Running",
  neutral: "No data",
};

const statusToneClasses: Record<StatusTone, string> = {
  pass:
    "border-[color:var(--radar-status-pass-border)] bg-[var(--radar-status-pass-bg)] text-[color:var(--radar-status-pass-text)]",
  warning:
    "border-[color:var(--radar-status-warning-border)] bg-[var(--radar-status-warning-bg)] text-[color:var(--radar-status-warning-text)]",
  fail:
    "border-[color:var(--radar-status-fail-border)] bg-[var(--radar-status-fail-bg)] text-[color:var(--radar-status-fail-text)]",
  running:
    "border-[color:var(--radar-status-running-border)] bg-[var(--radar-status-running-bg)] text-[color:var(--radar-status-running-text)]",
  neutral:
    "border-[color:var(--radar-status-neutral-border)] bg-[var(--radar-status-neutral-bg)] text-[color:var(--radar-status-neutral-text)]",
};

export function StatusBadge({
  tone = "neutral",
  label,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", statusToneClasses[tone], className)}
      {...props}
    >
      {children}
      {label ?? statusLabels[tone]}
    </Badge>
  );
}

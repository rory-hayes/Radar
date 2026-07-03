import { EmptyState, StatusBadge } from "@/components/radar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { CommandCenterCategoryHealth } from "@/lib/command-center/kpi-summary";

type AssertionHealthPanelProps = {
  categories: readonly CommandCenterCategoryHealth[];
};

export function AssertionHealthPanel({ categories }: AssertionHealthPanelProps) {
  const hasAssertions = categories.some((category) => category.totalAssertions > 0);

  if (!hasAssertions) {
    return (
      <EmptyState
        title="No assertion health yet"
        description="Category health appears after assertions are created for pricing, onboarding, billing, support, or custom checks."
        details={["Category", "Pass rate", "Open findings"]}
      />
    );
  }

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>Assertion health by category</CardTitle>
        <CardDescription>Where customer-facing risk is concentrated across active business assertions.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {categories.map((category, index) => (
          <div key={category.category} className="flex flex-col gap-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(11rem,0.7fr)_minmax(0,1fr)_minmax(12rem,0.5fr)] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground">{category.label}</h2>
                  <StatusBadge tone={category.tone} label={categoryStatusLabel(category)} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {category.activeAssertions} active of {category.totalAssertions} assertions
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Pass rate</span>
                  <span className="font-medium">{formatPassRate(category.passRate)}</span>
                </div>
                <Progress value={category.passRate ?? 0} aria-label={`${category.label} pass rate`} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Metric label="Findings" value={category.activeFindings} />
                <Metric label="Critical" value={category.criticalFindings} />
              </div>
            </div>
            {index < categories.length - 1 ? <Separator /> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-normal text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 text-lg font-semibold leading-none">{value}</p>
    </div>
  );
}

function formatPassRate(passRate: number | null) {
  return passRate === null ? "No runs" : `${passRate}%`;
}

function categoryStatusLabel(category: CommandCenterCategoryHealth) {
  if (category.criticalFindings > 0) return "Critical";
  if (category.activeFindings > 0) return "Review";
  if (category.passRate !== null) return "Tracked";
  return "No runs";
}

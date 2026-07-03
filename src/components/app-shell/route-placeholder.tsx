import { EmptyState } from "@/components/radar/empty-state";
import { MetricCard } from "@/components/radar/metric-card";

type PlaceholderPanel = {
  title: string;
  description: string;
};

type RoutePlaceholderProps = {
  panels: readonly PlaceholderPanel[];
  emptyState?: {
    title: string;
    description: string;
    details?: readonly string[];
    action?: React.ReactNode;
  };
};

export function RoutePlaceholder({ panels, emptyState }: RoutePlaceholderProps) {
  return (
    <section className="flex flex-col gap-4" aria-label="Route foundation">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {panels.map((panel) => (
          <MetricCard key={panel.title} label={panel.title} value="No records" helperText={panel.description} />
        ))}
      </div>
      {emptyState ? (
        <EmptyState
          title={emptyState.title}
          description={emptyState.description}
          details={emptyState.details}
          action={emptyState.action}
        />
      ) : null}
    </section>
  );
}

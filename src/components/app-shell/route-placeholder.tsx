import { MetricCard } from "@/components/radar/metric-card";

type PlaceholderPanel = {
  title: string;
  description: string;
};

type RoutePlaceholderProps = {
  panels: readonly PlaceholderPanel[];
};

export function RoutePlaceholder({ panels }: RoutePlaceholderProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Route foundation">
      {panels.map((panel) => (
        <MetricCard key={panel.title} label={panel.title} value="No records" helperText={panel.description} />
      ))}
    </section>
  );
}

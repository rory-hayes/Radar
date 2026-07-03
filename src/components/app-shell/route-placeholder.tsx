import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
        <Card key={panel.title} className="rounded-lg" size="sm">
          <CardHeader>
            <CardTitle>{panel.title}</CardTitle>
            <CardDescription>{panel.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No records yet.</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  details?: readonly string[];
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ title, description, details = [], action, className }: EmptyStateProps) {
  return (
    <Card size="sm" className={cn("rounded-lg border-dashed bg-card/80", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="max-w-2xl leading-6">{description}</CardDescription>
      </CardHeader>
      {details.length > 0 ? (
        <CardContent>
          <ul className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
            {details.map((detail) => (
              <li key={detail} className="rounded-md border bg-background px-3 py-2">
                {detail}
              </li>
            ))}
          </ul>
        </CardContent>
      ) : null}
      {action ? <CardFooter className="justify-start">{action}</CardFooter> : null}
    </Card>
  );
}

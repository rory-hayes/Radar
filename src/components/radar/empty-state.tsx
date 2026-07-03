import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={cn("rounded-lg border-dashed", className)}>
      <CardContent className="flex flex-col gap-3 py-8">
        <div className="flex max-w-lg flex-col gap-2">
          <h2 className="text-base font-semibold tracking-normal text-foreground">{title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {action ? <div className="flex items-center gap-2">{action}</div> : null}
      </CardContent>
    </Card>
  );
}

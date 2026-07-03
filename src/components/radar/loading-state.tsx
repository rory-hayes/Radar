import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  title?: string;
  description?: string;
  rows?: number;
  variant?: "cards" | "list" | "form";
  className?: string;
};

export function LoadingState({
  title = "Loading",
  description = "Preparing the latest Radar workspace state.",
  rows = 4,
  variant = "cards",
  className,
}: LoadingStateProps) {
  return (
    <section
      className={cn("flex flex-col gap-6", className)}
      aria-busy="true"
      aria-label={title}
      aria-live="polite"
    >
      <div className="flex flex-col gap-3 border-b border-border/80 pb-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-5 w-[min(34rem,100%)]" />
        <span className="sr-only">{description}</span>
      </div>
      {variant === "cards" ? <CardSkeletonGrid rows={rows} /> : null}
      {variant === "list" ? <ListSkeleton rows={rows} /> : null}
      {variant === "form" ? <FormSkeleton rows={rows} /> : null}
    </section>
  );
}

function CardSkeletonGrid({ rows }: { rows: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-32 rounded-lg" />
      ))}
    </div>
  );
}

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-44 max-w-full" />
              <Skeleton className="h-4 w-[min(28rem,100%)]" />
            </div>
            <Skeleton className="h-7 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FormSkeleton({ rows }: { rows: number }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex max-w-2xl flex-col gap-5">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

type LoadingStateProps = {
  title?: string;
  rows?: number;
};

export function LoadingState({ title = "Loading", rows = 4 }: LoadingStateProps) {
  return (
    <div className="flex flex-col gap-6" aria-label={title}>
      <div className="flex flex-col gap-3 border-b border-border/80 pb-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-5 w-[min(34rem,100%)]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

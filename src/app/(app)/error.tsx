"use client";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="flex min-h-[50vh] flex-col justify-center gap-5">
      <div className="flex max-w-xl flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-normal text-foreground">
          Radar could not load this workspace view.
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Retry the route. If it fails again, keep the error reference with the ticket notes.
        </p>
        {error.digest ? <p className="text-sm text-destructive">Reference: {error.digest}</p> : null}
      </div>
      <div>
        <Button type="button" onClick={reset}>
          Retry
        </Button>
      </div>
    </section>
  );
}

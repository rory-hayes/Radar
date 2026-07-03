"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/radar";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="flex min-h-[50vh] flex-col justify-center gap-5">
      <ErrorState
        title="Radar could not load this workspace view."
        description="Retry the route. If it fails again, keep the error reference with the ticket notes."
        reference={error.digest}
        action={
          <Button type="button" onClick={reset}>
            Retry
          </Button>
        }
      />
    </section>
  );
}

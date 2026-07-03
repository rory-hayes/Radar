"use client";

import { ErrorState } from "@/components/radar";
import { Button } from "@/components/ui/button";

export default function SourcesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="flex flex-col gap-6">
      <ErrorState
        title="Sources could not load"
        description="Retry the Sources view. If it fails again, keep the error reference with the source evidence ticket."
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

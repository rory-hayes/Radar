"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { ErrorState } from "@/components/radar";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-center p-6">
      <ErrorState
        title="Radar could not load"
        description="Radar hit an unexpected runtime error. Try again, and keep the reference if the issue repeats."
        reference={error.digest}
        action={
          <Button type="button" onClick={reset}>
            Try again
          </Button>
        }
      />
    </main>
  );
}

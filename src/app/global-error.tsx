"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { ErrorState } from "@/components/radar";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-center p-6">
          <ErrorState
            title="Radar could not load"
            description="Radar captured this runtime error. Keep the reference if it repeats."
            reference={error.digest}
          />
        </main>
      </body>
    </html>
  );
}

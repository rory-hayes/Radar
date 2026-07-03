"use client";

import { ErrorState } from "@/components/radar";
import { Button } from "@/components/ui/button";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="w-full max-w-md">
      <ErrorState
        title="Authentication could not load."
        description="Retry the form. If it fails again, keep the reference and check the auth configuration."
        reference={error.digest}
        action={
          <Button type="button" onClick={reset}>
            Retry
          </Button>
        }
      />
    </div>
  );
}

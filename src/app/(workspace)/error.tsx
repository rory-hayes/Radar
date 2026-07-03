"use client";

import { ErrorState } from "@/components/radar";
import { Button } from "@/components/ui/button";

export default function WorkspaceSetupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="w-full max-w-md">
      <ErrorState
        title="Workspace setup could not load."
        description="Retry workspace setup. If it fails again, keep the reference for debugging."
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

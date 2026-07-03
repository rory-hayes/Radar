import { LoadingState } from "@/components/radar";

export default function FindingsLoading() {
  return (
    <LoadingState
      title="Loading findings"
      description="Preparing workspace exceptions, filters, severity, ownership, and affected assertion context."
      rows={6}
      variant="list"
    />
  );
}

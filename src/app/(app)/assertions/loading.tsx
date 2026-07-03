import { LoadingState } from "@/components/radar";

export default function AssertionsLoading() {
  return (
    <LoadingState
      title="Loading assertions"
      description="Preparing workspace assertions, filters, source counts, and latest run context."
      rows={6}
      variant="list"
    />
  );
}

import { LoadingState } from "@/components/radar";

export default function SourceDetailLoading() {
  return (
    <LoadingState
      title="Loading source detail"
      description="Preparing source health, versions, linked assertions, and extracted content."
      rows={6}
      variant="list"
    />
  );
}

import { LoadingState } from "@/components/radar";

export default function SourcesLoading() {
  return (
    <LoadingState
      title="Loading sources"
      description="Preparing workspace source cards, sync health, and affected assertion counts."
      rows={5}
      variant="list"
    />
  );
}

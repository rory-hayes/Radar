import { LoadingState } from "@/components/radar";

export default function AppLoading() {
  return (
    <LoadingState
      title="Loading Radar workspace view"
      description="Preparing workspace assertions, findings, and source summaries."
      rows={4}
      variant="cards"
    />
  );
}

import { LoadingState } from "@/components/radar";

export default function NewAssertionLoading() {
  return (
    <LoadingState
      title="Loading assertion form"
      description="Preparing assertion setup fields and available evidence sources."
      rows={5}
      variant="form"
    />
  );
}

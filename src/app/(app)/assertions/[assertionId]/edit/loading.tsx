import { LoadingState } from "@/components/radar";

export default function EditAssertionLoading() {
  return (
    <LoadingState
      title="Loading assertion"
      description="Preparing assertion details, schedule settings, and linked evidence sources."
      rows={5}
      variant="form"
    />
  );
}

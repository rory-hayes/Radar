import { LoadingState } from "@/components/radar";

export default function AssertionDetailLoading() {
  return (
    <LoadingState
      title="Loading assertion detail"
      description="Preparing assertion summary, linked sources, test cases, run history, and findings."
    />
  );
}

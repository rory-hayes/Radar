import { LoadingState } from "@/components/radar";

export default function CommandCenterLoading() {
  return (
    <LoadingState
      title="Loading Command Center"
      description="Preparing workspace checks, exceptions, pass rate, and trend indicators."
      rows={6}
    />
  );
}

import { LoadingState } from "@/components/radar/loading-state";

export default function AuthLoading() {
  return (
    <div className="w-full max-w-md">
      <LoadingState
        title="Loading authentication"
        description="Preparing the secure authentication form."
        rows={3}
        variant="form"
      />
    </div>
  );
}

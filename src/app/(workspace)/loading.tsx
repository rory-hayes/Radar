import { LoadingState } from "@/components/radar";

export default function WorkspaceSetupLoading() {
  return (
    <div className="w-full max-w-md">
      <LoadingState
        title="Loading workspace setup"
        description="Preparing workspace creation."
        rows={2}
        variant="form"
      />
    </div>
  );
}

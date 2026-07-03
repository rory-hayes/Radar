import { LoadingState } from "@/components/radar";

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-center p-6">
      <LoadingState title="Loading Radar" description="Preparing the assertion-led workspace foundation." />
    </main>
  );
}

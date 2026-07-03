import { NotFoundState } from "@/components/radar";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-center p-6">
      <NotFoundState
        title="Page not found"
        description="Radar has not introduced that route in the active build phase."
        href="/"
        actionLabel="Return to Radar"
      />
    </main>
  );
}

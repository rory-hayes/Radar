import { NotFoundState } from "@/components/radar";

export default function AppNotFound() {
  return (
    <section className="flex min-h-[50vh] flex-col justify-center">
      <NotFoundState
        title="Workspace view not found"
        description="Radar keeps the authenticated product limited to Command Center, Assertions, Findings, Sources, and scoped settings."
        href="/command-center"
        actionLabel="Return to Command Center"
      />
    </section>
  );
}

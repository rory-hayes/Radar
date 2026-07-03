import type { Metadata } from "next";

import { PageHeader } from "@/components/app-shell";
import { RoutePlaceholder } from "@/components/app-shell/route-placeholder";
import { getAppRouteByHref } from "@/lib/radar-routes";

const route = getAppRouteByHref("/findings");

export const metadata: Metadata = {
  title: "Findings | Radar",
};

const panels = [
  {
    title: "Finding inbox",
    description: "Open exceptions will be prioritized by severity and customer impact.",
  },
  {
    title: "Evidence",
    description: "Expected versus actual details stay tied to source citations.",
  },
  {
    title: "Resolution",
    description: "Lifecycle state stays tied to permissioned workspace actions.",
  },
  {
    title: "Recommended fix",
    description: "Fix summaries stay grounded in the evidence for each failure.",
  },
] as const;

export default function FindingsPage() {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={route?.title ?? "Findings"} description={route?.description ?? ""} />
      <RoutePlaceholder panels={panels} />
    </section>
  );
}

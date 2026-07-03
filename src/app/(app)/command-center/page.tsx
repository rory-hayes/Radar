import type { Metadata } from "next";

import { PageHeader } from "@/components/app-shell";
import { RoutePlaceholder } from "@/components/app-shell/route-placeholder";
import { getAppRouteByHref } from "@/lib/radar-routes";

const route = getAppRouteByHref("/command-center");

export const metadata: Metadata = {
  title: "Command Center | Radar",
};

const panels = [
  {
    title: "Checks run",
    description: "Operational count appears after assertion runs begin.",
  },
  {
    title: "Exceptions",
    description: "Failed or warning results surface here as findings are created.",
  },
  {
    title: "Recommended fixes",
    description: "Fix guidance waits for evidence-backed findings.",
  },
  {
    title: "Critical issues",
    description: "Customer-facing risk stays visible without broad analytics noise.",
  },
] as const;

export default function CommandCenterPage() {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={route?.title ?? "Command Center"} description={route?.description ?? ""} />
      <RoutePlaceholder panels={panels} />
    </section>
  );
}

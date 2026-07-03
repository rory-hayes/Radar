import type { Metadata } from "next";

import { PageHeader } from "@/components/app-shell";
import { RoutePlaceholder } from "@/components/app-shell/route-placeholder";
import { getAppRouteByHref } from "@/lib/radar-routes";

const route = getAppRouteByHref("/assertions");

export const metadata: Metadata = {
  title: "Assertions | Radar",
};

const panels = [
  {
    title: "Assertion list",
    description: "Approved business truths will appear with status and priority.",
  },
  {
    title: "Runner coverage",
    description: "Knowledge, Journey, and Integration runners stay attached to assertions.",
  },
  {
    title: "Source links",
    description: "Only required evidence sources are connected for each assertion.",
  },
  {
    title: "Schedule",
    description: "Cadence and manual run controls stay attached to the assertion.",
  },
] as const;

export default function AssertionsPage() {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={route?.title ?? "Assertions"} description={route?.description ?? ""} />
      <RoutePlaceholder panels={panels} />
    </section>
  );
}

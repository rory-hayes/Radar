import type { Metadata } from "next";

import { PageHeader } from "@/components/app-shell";
import { RoutePlaceholder } from "@/components/app-shell/route-placeholder";
import { getAppRouteByHref } from "@/lib/radar-routes";

const route = getAppRouteByHref("/sources");

export const metadata: Metadata = {
  title: "Sources | Radar",
};

const panels = [
  {
    title: "Connected sources",
    description: "URL, document, text, and endpoint sources appear only when assertions need them.",
  },
  {
    title: "Sync health",
    description: "Ingestion status and errors stay attached to source records.",
  },
  {
    title: "Affected assertions",
    description: "Source changes will identify which assertions need reruns.",
  },
  {
    title: "Evidence snapshots",
    description: "Historical runs reference bounded source documents and chunks.",
  },
] as const;

export default function SourcesPage() {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={route?.title ?? "Sources"} description={route?.description ?? ""} />
      <RoutePlaceholder
        panels={panels}
        emptyState={{
          title: "No sources are required yet",
          description:
            "Sources are connected after an assertion needs evidence from a URL, document, manual policy, endpoint, or customer journey.",
          details: ["Source type", "Sync health", "Affected assertions"],
        }}
      />
    </section>
  );
}

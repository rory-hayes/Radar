import type { Metadata } from "next";

import { PageHeader } from "@/components/app-shell";
import { RoutePlaceholder } from "@/components/app-shell/route-placeholder";
import { settingsRoute } from "@/lib/radar-routes";

export const metadata: Metadata = {
  title: "Settings | Radar",
};

const panels = [
  {
    title: "Workspace",
    description: "Name, slug, and membership controls stay scoped to the workspace.",
  },
  {
    title: "Access",
    description: "Role and permission controls stay server-guarded.",
  },
  {
    title: "Environment",
    description: "Deployment and local state stay visible without joining primary navigation.",
  },
  {
    title: "Billing",
    description: "Plan and usage controls are reserved for production readiness.",
  },
] as const;

export default function SettingsPage() {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={settingsRoute.title} description={settingsRoute.description} status="Hidden" />
      <RoutePlaceholder panels={panels} />
    </section>
  );
}

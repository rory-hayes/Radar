import Link from "next/link";
import {
  BookOpenCheck,
  Building2,
  CheckCircle2,
  Cloud,
  FileText,
  LifeBuoy,
  LockKeyhole,
  PlugZap,
  type LucideIcon,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-surfaces";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const connectorOptions = [
  {
    title: "Upload files",
    description: "Use the production ingestion path for policies, FAQs, playbooks, notes, CSV, JSON, and text exports.",
    status: "Available now",
    href: "/app/uploads",
    action: "Upload source",
    icon: FileText,
    ready: true,
  },
  {
    title: "Google Drive and Docs",
    description: "Sync approved folders and documents from where teams already maintain customer-facing knowledge.",
    status: "Next connector",
    icon: Cloud,
  },
  {
    title: "Confluence and Jira",
    description: "Bring product docs, runbooks, release notes, and escalation tickets into the review queue.",
    status: "Next connector",
    icon: BookOpenCheck,
  },
  {
    title: "Notion",
    description: "Sync selected workspace pages and databases after an admin approves the source scope.",
    status: "Next connector",
    icon: Building2,
  },
  {
    title: "Support and CRM",
    description: "Connect Zendesk, Intercom, Salesforce, or HubSpot knowledge that can support live customer answers.",
    status: "Roadmap",
    icon: LifeBuoy,
  },
];

export default function ConnectorsPage() {
  return (
    <>
      <AdminPageHeader
        title="Connectors"
        description="Start with uploads today, then connect the systems where approved knowledge already lives."
      >
        <Button asChild>
          <Link href="/app/uploads">
            <FileText data-icon="inline-start" />
            Upload source
          </Link>
        </Button>
      </AdminPageHeader>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="grid gap-4 md:grid-cols-2">
          {connectorOptions.map((connector) => (
            <ConnectorCard key={connector.title} connector={connector} />
          ))}
        </section>

        <aside className="flex flex-col gap-4">
          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-950 text-white">
                <LockKeyhole />
              </div>
              <CardTitle className="text-base">Connector rule</CardTitle>
              <CardDescription className="leading-6">
                A connector should never make knowledge available to reps until an admin approves
                the source scope and Radar can cite it.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-950 text-white">
                <PlugZap />
              </div>
              <CardTitle className="text-base">Best next apps</CardTitle>
              <CardDescription className="leading-6">
                Prioritize Google Drive, Confluence, Notion, and support knowledge bases because
                those are where admins already maintain reusable answers.
              </CardDescription>
            </CardHeader>
          </Card>
        </aside>
      </div>
    </>
  );
}

function ConnectorCard({
  connector,
}: {
  connector: {
    title: string;
    description: string;
    status: string;
    href?: string;
    action?: string;
    icon: LucideIcon;
    ready?: boolean;
  };
}) {
  const Icon = connector.icon;

  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800">
            <Icon />
          </div>
          <Badge
            variant="outline"
            className={
              connector.ready
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-zinc-200 bg-zinc-50 text-zinc-600"
            }
          >
            {connector.ready ? <CheckCircle2 /> : null}
            {connector.status}
          </Badge>
        </div>
        <CardTitle className="text-base">{connector.title}</CardTitle>
        <CardDescription className="leading-6">{connector.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {connector.href ? (
          <Button asChild variant="outline" className="w-full">
            <Link href={connector.href}>{connector.action}</Link>
          </Button>
        ) : (
          <Button type="button" variant="outline" className="w-full" disabled>
            Not wired yet
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

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

import { ConnectorRequestForm } from "@/components/admin/connector-request-form";
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
import { getAdminCollection, getAdminContext, type AdminDataResult, type AdminRecord } from "@/lib/admin-data";
import type { ConnectorType } from "@/lib/connectors/store";

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
    status: "Request setup",
    connectorType: "google_drive",
    icon: Cloud,
  },
  {
    title: "Confluence and Jira",
    description: "Bring product docs, runbooks, release notes, and escalation tickets into the review queue.",
    status: "Request setup",
    connectorType: "confluence_jira",
    icon: BookOpenCheck,
  },
  {
    title: "Notion",
    description: "Sync selected workspace pages and databases after an admin approves the source scope.",
    status: "Request setup",
    connectorType: "notion",
    icon: Building2,
  },
  {
    title: "Support and CRM",
    description: "Connect Zendesk, Intercom, Salesforce, or HubSpot knowledge that can support live customer answers.",
    status: "Request setup",
    connectorType: "support_crm",
    icon: LifeBuoy,
  },
] satisfies ConnectorOption[];

type ConnectorOption = {
  title: string;
  description: string;
  status: string;
  href?: string;
  action?: string;
  icon: LucideIcon;
  ready?: boolean;
  connectorType?: ConnectorType;
};

type ConnectorsPageProps = {
  searchParams?: Promise<{
    connector?: string;
  }>;
};

export default async function ConnectorsPage({ searchParams }: ConnectorsPageProps) {
  const params = await searchParams;
  const context = await getAdminContext();
  const result = await getAdminCollection("connectors", context);
  const initialConnectorType = parseConnectorType(params?.connector);

  return (
    <>
      <AdminPageHeader
        title="Connectors"
        description="Request the tools where approved knowledge already lives. Sync stays off until source scope and ownership are clear."
      >
        <Button asChild>
          <Link href="/app/connectors#connector-request">
            <PlugZap data-icon="inline-start" />
            Request connector
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/app/uploads">
            <FileText data-icon="inline-start" />
            Upload source
          </Link>
        </Button>
      </AdminPageHeader>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-4">
          <section className="grid gap-4 md:grid-cols-2">
            {connectorOptions.map((connector) => (
              <ConnectorCard key={connector.title} connector={connector} />
            ))}
          </section>

          <Card className="rounded-lg shadow-sm">
            <CardHeader className="gap-2">
              <CardTitle className="text-xl">Setup queue</CardTitle>
              <CardDescription className="leading-6">
                Connector requests are saved here before sync is enabled for the approved source scope.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectorQueue result={result} />
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <Card className="rounded-lg shadow-sm">
            <CardHeader className="gap-2">
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
            <CardHeader className="gap-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-950 text-white">
                <PlugZap />
              </div>
              <CardTitle className="text-base">Request setup</CardTitle>
              <CardDescription className="leading-6">
                Tell Radar which tool, folder, space, or knowledge base should be connected first.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectorRequestForm initialConnectorType={initialConnectorType} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}

function ConnectorCard({ connector }: { connector: ConnectorOption }) {
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
        ) : connector.connectorType ? (
          <Button asChild variant="outline" className="w-full">
            <Link href={`/app/connectors?connector=${connector.connectorType}#connector-request`}>
              Request setup
            </Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ConnectorQueue({ result }: { result: AdminDataResult<AdminRecord[]> }) {
  if (result.state !== "ready") {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
        Connect the workspace database before Radar can save connector requests.
      </div>
    );
  }

  if (result.data.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
        No connector requests yet. Request one source system to define the first sync scope.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      {result.data.map((record, index) => {
        const title = toDisplayValue(record.title) || "Connector request";
        const connectorType = formatConnectorType(toDisplayValue(record.connectorType));
        const sourceLocation = toDisplayValue(record.sourceLocation);
        const status = formatStatus(toDisplayValue(record.status));

        return (
          <div key={toDisplayValue(record.id) || index} className="border-b border-zinc-200 p-4 last:border-b-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
                <p className="mt-1 text-xs text-zinc-500">{connectorType}</p>
              </div>
              <Badge variant="outline">{status}</Badge>
            </div>
            {sourceLocation ? (
              <p className="mt-3 text-sm leading-5 text-zinc-600">{sourceLocation}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function parseConnectorType(value: string | undefined): ConnectorType {
  const validTypes: ConnectorType[] = [
    "google_drive",
    "confluence_jira",
    "notion",
    "support_crm",
    "other",
  ];

  return validTypes.includes(value as ConnectorType) ? (value as ConnectorType) : "google_drive";
}

function toDisplayValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function formatConnectorType(value: string) {
  const labels: Record<string, string> = {
    google_drive: "Google Drive and Docs",
    confluence_jira: "Confluence and Jira",
    notion: "Notion",
    support_crm: "Support or CRM",
    other: "Other",
  };

  return labels[value] ?? "Connector";
}

function formatStatus(value: string) {
  return value ? value.replaceAll("_", " ") : "requested";
}

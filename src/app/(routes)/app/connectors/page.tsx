import Link from "next/link";
import {
  BookOpenCheck,
  Building2,
  Cloud,
  LifeBuoy,
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
    title: "Google Drive and Docs",
    description: "Approved folders, Docs, Sheets, and exported source material.",
    connectorType: "google_drive",
    icon: Cloud,
  },
  {
    title: "Confluence and Jira",
    description: "Product docs, runbooks, release notes, and escalation tickets.",
    connectorType: "confluence_jira",
    icon: BookOpenCheck,
  },
  {
    title: "Notion",
    description: "Selected workspace pages, databases, and team knowledge hubs.",
    connectorType: "notion",
    icon: Building2,
  },
  {
    title: "Support and CRM",
    description: "Zendesk, Intercom, Salesforce, HubSpot, or support knowledge bases.",
    connectorType: "support_crm",
    icon: LifeBuoy,
  },
] satisfies ConnectorOption[];

type ConnectorOption = {
  title: string;
  description: string;
  icon: LucideIcon;
  connectorType: ConnectorType;
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
        description="Request the one source system where approved knowledge already lives. Sync stays off until an admin confirms scope and ownership."
      >
        <Button asChild>
          <Link href="/app/connectors#connector-request">
            <PlugZap data-icon="inline-start" />
            Request connector
          </Link>
        </Button>
      </AdminPageHeader>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-4">
          <Card id="connector-request" className="rounded-lg shadow-sm">
            <CardHeader className="gap-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-950 text-white">
                <PlugZap />
              </div>
              <CardTitle className="text-xl">Request connector</CardTitle>
              <CardDescription className="leading-6">
                Tell Radar which tool, folder, space, or knowledge base should be connected first.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectorRequestForm initialConnectorType={initialConnectorType} />
            </CardContent>
          </Card>

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

        <aside>
          <Card className="rounded-lg shadow-sm">
            <CardHeader className="gap-2">
              <CardTitle className="text-xl">Common systems</CardTitle>
              <CardDescription className="leading-6">
                Choose one to prefill the request form. Credentials and sync remain off until setup is approved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {connectorOptions.map((connector) => (
                  <ConnectorOptionRow key={connector.title} connector={connector} />
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}

function ConnectorOptionRow({ connector }: { connector: ConnectorOption }) {
  const Icon = connector.icon;

  return (
    <Link
      href={`/app/connectors?connector=${connector.connectorType}#connector-request`}
      className="group flex gap-3 rounded-lg border border-zinc-200 p-3 transition hover:bg-zinc-50"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800">
        <Icon />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-zinc-950">{connector.title}</span>
        <span className="mt-1 block text-sm leading-5 text-zinc-600">{connector.description}</span>
        <span className="mt-2 block text-sm font-semibold text-zinc-950">
          Select source system
        </span>
      </span>
    </Link>
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

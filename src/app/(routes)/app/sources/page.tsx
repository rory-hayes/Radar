import Link from "next/link";
import {
  ArrowRight,
  FileText,
  PlugZap,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-surfaces";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminCollection, getAdminContext, type AdminDataResult, type AdminRecord } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const context = await getAdminContext();
  const result = await getAdminCollection("sources", context);

  return (
    <>
      <AdminPageHeader
        title="Knowledge"
        description="The approved source base Radar can retrieve and cite during customer conversations."
      >
        <Button asChild>
          <Link href="#add-source">
            <UploadCloud data-icon="inline-start" />
            Add source
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/app/connectors#connector-request">
            <PlugZap data-icon="inline-start" />
            Connect tool
          </Link>
        </Button>
      </AdminPageHeader>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-4">
          <AddSourcePanel />

          <Card className="rounded-lg shadow-sm">
            <CardHeader className="gap-2">
              <CardTitle className="text-xl">Workspace knowledge</CardTitle>
              <CardDescription className="leading-6">
                Uploads and connected tools should all land here as approved, citable sources.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KnowledgeList result={result} />
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-lg shadow-sm">
          <CardHeader className="gap-2">
            <CardTitle className="text-xl">Source rule</CardTitle>
            <CardDescription className="leading-6">
              Start narrow, approve the source, then expand sync scope only when the evidence is useful.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <SourceRule label="Fastest first source" value="Paste a playbook, FAQ, or policy." />
            <SourceRule label="Connector setup" value="Request the exact folder, space, or knowledge base first." />
            <SourceRule label="Before live use" value="Radar should cite only approved source chunks." />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

const addSourceOptions = [
  {
    title: "Connect a tool",
    body: "Request the Drive, Confluence, Notion, CRM, or support source where the team already keeps approved knowledge.",
    href: "/app/connectors#connector-request",
    action: "Choose connector",
    icon: PlugZap,
  },
  {
    title: "Upload or paste source",
    body: "Add a policy, FAQ, playbook, note, export, or text-based document directly to the workspace knowledge base.",
    href: "/app/uploads",
    action: "Upload source",
    icon: UploadCloud,
  },
] satisfies Array<{
  title: string;
  body: string;
  href: string;
  action: string;
  icon: LucideIcon;
}>;

function AddSourcePanel() {
  return (
    <Card id="add-source" className="rounded-lg shadow-sm">
      <CardHeader className="gap-2">
        <CardTitle className="text-xl">Add source</CardTitle>
        <CardDescription className="leading-6">
          Choose the shortest path to approved knowledge. Connector requests stay in setup until
          an admin confirms the exact source scope.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {addSourceOptions.map((option) => (
          <AddSourceOption key={option.title} option={option} />
        ))}
      </CardContent>
    </Card>
  );
}

function AddSourceOption({
  option,
}: {
  option: (typeof addSourceOptions)[number];
}) {
  const Icon = option.icon;

  return (
    <Link
      href={option.href}
      className="group flex h-full flex-col justify-between rounded-lg border border-zinc-200 p-4 transition hover:bg-zinc-50"
    >
      <span>
        <span className="flex size-10 items-center justify-center rounded-lg bg-zinc-950 text-white">
          <Icon />
        </span>
        <span className="mt-4 block text-sm font-semibold text-zinc-950">{option.title}</span>
        <span className="mt-2 block text-sm leading-6 text-zinc-600">{option.body}</span>
      </span>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-zinc-950">
        {option.action}
        <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function KnowledgeList({ result }: { result: AdminDataResult<AdminRecord[]> }) {
  if (result.state === "empty") {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
        No knowledge sources yet. Upload one source or connect a tool before users rely on Radar in
        calls.
      </div>
    );
  }

  if (result.state !== "ready") {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
        {result.message || "Connect the workspace database before Radar can load approved knowledge."}
      </div>
    );
  }

  if (result.data.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
        No knowledge sources yet. Upload one source or connect a tool before users rely on Radar in
        calls.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      {result.data.map((record, index) => {
        const id = toDisplayValue(record.id ?? record.slug ?? record.key);
        const title = toDisplayValue(record.title ?? record.name ?? record.label ?? id);
        const type = toDisplayValue(record.sourceType ?? record.source_type ?? record.type);
        const status = toDisplayValue(record.status ?? record.state);

        return (
          <Link
            key={id || index}
            href={id ? `/app/sources/${encodeURIComponent(id)}` : "/app/sources"}
            className="flex flex-col gap-3 border-b border-zinc-200 p-4 last:border-b-0 hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                <FileText />
              </span>
              <span>
                <span className="block text-sm font-semibold text-zinc-950">
                  {title || "Untitled source"}
                </span>
                <span className="mt-1 block text-xs text-zinc-500">
                  {[type, status].filter(Boolean).join(" / ") || "Source"}
                </span>
              </span>
            </div>
            <span className="text-sm font-semibold text-zinc-950">Open</span>
          </Link>
        );
      })}
    </div>
  );
}

function SourceRule({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      <h2 className="text-sm font-semibold text-zinc-950">{label}</h2>
      <p className="mt-1 text-sm leading-5 text-zinc-600">{value}</p>
    </div>
  );
}

function toDisplayValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

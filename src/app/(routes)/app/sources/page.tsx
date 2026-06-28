import Link from "next/link";
import { FileText, PlugZap, UploadCloud } from "lucide-react";

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
          <Link href="/app/uploads">
            <UploadCloud data-icon="inline-start" />
            Upload source
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/app/connectors">
            <PlugZap data-icon="inline-start" />
            Connect tool
          </Link>
        </Button>
      </AdminPageHeader>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
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

        <Card className="rounded-lg shadow-sm">
          <CardHeader className="gap-2">
            <CardTitle className="text-xl">Best next source</CardTitle>
            <CardDescription className="leading-6">
              Start with one high-signal source before adding broad syncs.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <SourcePath
              title="Playbook or FAQ"
              body="Fastest path to useful cited answers."
              href="/app/uploads?type=playbook"
            />
            <SourcePath
              title="Docs or wiki"
              body="Connect the system of record when OAuth sync is ready."
              href="/app/connectors"
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function KnowledgeList({ result }: { result: AdminDataResult<AdminRecord[]> }) {
  if (result.state !== "ready") {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
        Connect the workspace database before Radar can load approved knowledge.
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

function SourcePath({ title, body, href }: { title: string; body: string; href: string }) {
  return (
    <Link href={href} className="rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50">
      <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
      <p className="mt-1 text-sm leading-5 text-zinc-600">{body}</p>
    </Link>
  );
}

function toDisplayValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

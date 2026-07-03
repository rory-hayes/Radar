import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ExternalLinkIcon,
  PencilIcon,
  RefreshCwIcon,
} from "lucide-react";

import { resyncSourceAction } from "@/app/(app)/sources/actions";
import { PageHeader } from "@/components/app-shell";
import { EmptyState, ErrorState, EvidenceSnippet, MetricCard, StatusBadge } from "@/components/radar";
import {
  formatSourceTimestamp,
  sourceSyncStatusLabel,
  sourceSyncStatusTone,
  sourceTypeLabel,
} from "@/components/sources/source-card";
import { SourceDeletePanel } from "@/components/sources/source-delete-panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getSourceById,
  listAssertions,
  listAssertionSourcesForSource,
  listSourceChunksPreview,
  listSourceDocuments,
  listSourceVersions,
  type RadarAssertionSource,
  type RadarSourceDocumentDetail,
  type RadarSourceVersionDetail,
} from "@/lib/repositories";
import { type RadarAssertion } from "@/lib/assertions/schema";
import { type RadarSourceChunk } from "@/lib/sources/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { membershipCan } from "@/lib/workspaces/permissions";
import { requireActiveWorkspace } from "@/lib/workspaces/server";

type SourceDetailPageProps = {
  params: Promise<{
    sourceId: string;
  }>;
};

type LinkedAssertion = RadarAssertion & {
  link: RadarAssertionSource;
};

export const metadata: Metadata = {
  title: "Source detail | Radar",
};

export default async function SourceDetailPage({ params }: SourceDetailPageProps) {
  const { sourceId } = await params;
  const membership = await requireActiveWorkspace();
  const supabase = await createSupabaseServerClient();
  const canEditSource = membershipCan(membership, "source:edit");

  if (!supabase) {
    return (
      <SourceDetailShell title="Source detail" status="Unavailable">
        <ErrorState
          title="Source could not load"
          description="Supabase is not configured for this environment, so Radar cannot read this source."
          reference="source_detail.supabase_unconfigured"
        />
      </SourceDetailShell>
    );
  }

  const detail = await loadSourceDetail(supabase, membership.workspace.id, sourceId);

  if (detail.error) {
    return (
      <SourceDetailShell title="Source detail" status="Error">
        <ErrorState
          title="Source could not load"
          description="Radar could not read source detail records for the active workspace. Refresh after checking database connectivity and workspace permissions."
          reference={detail.error}
        />
      </SourceDetailShell>
    );
  }

  if (!detail.source) {
    notFound();
  }

  const source = detail.source;
  const canDeleteSource = membershipCan(membership, "source:delete");

  return (
    <SourceDetailShell
      title={source.name}
      description={source.description ?? sourceHealthDescription(source.syncStatus)}
      status={sourceSyncStatusLabel(source.syncStatus)}
      actions={
        <>
          <Button asChild variant="outline">
            <Link href="/sources">
              <ArrowLeftIcon data-icon="inline-start" />
              Sources
            </Link>
          </Button>
          {canEditSource ? (
            <>
              <Button asChild variant="outline">
                <Link href={`/sources/${source.id}/edit`}>
                  <PencilIcon data-icon="inline-start" />
                  Edit
                </Link>
              </Button>
              <form action={resyncSourceAction}>
                <input type="hidden" name="sourceId" value={source.id} />
                <Button type="submit">
                  <RefreshCwIcon data-icon="inline-start" />
                  Sync now
                </Button>
              </form>
            </>
          ) : null}
        </>
      }
    >
      {source.lastSyncError ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Latest sync needs attention</AlertTitle>
          <AlertDescription>{source.lastSyncError}</AlertDescription>
        </Alert>
      ) : null}

      <SourceDetailMetrics
        versions={detail.versions}
        documents={detail.documents}
        chunks={detail.chunks}
        linkedAssertions={detail.linkedAssertions}
      />

      <Tabs defaultValue="overview" className="flex flex-col gap-4">
        <TabsList className="w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="assertions">Assertions</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <SourceOverview source={source} documents={detail.documents} />
        </TabsContent>
        <TabsContent value="versions">
          <SourceVersionTable versions={detail.versions} />
        </TabsContent>
        <TabsContent value="content">
          <SourceContentPreview chunks={detail.chunks} documents={detail.documents} />
        </TabsContent>
        <TabsContent value="assertions">
          <LinkedAssertions assertions={detail.linkedAssertions} />
        </TabsContent>
      </Tabs>

      <SourceDeletePanel
        sourceId={source.id}
        sourceName={source.name}
        linkedAssertionCount={detail.linkedAssertions.length}
        canDelete={canDeleteSource}
      />
    </SourceDetailShell>
  );
}

async function loadSourceDetail(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  workspaceId: string,
  sourceId: string,
) {
  try {
    const [source, versions, documents, chunks, assertionLinks, assertions] = await Promise.all([
      getSourceById(supabase, workspaceId, sourceId),
      listSourceVersions(supabase, workspaceId, sourceId, { limit: 12 }),
      listSourceDocuments(supabase, workspaceId, sourceId, { limit: 20 }),
      listSourceChunksPreview(supabase, workspaceId, sourceId, { limit: 6 }),
      listAssertionSourcesForSource(supabase, workspaceId, sourceId),
      listAssertions(supabase, workspaceId),
    ]);
    const assertionsById = new Map(assertions.map((assertion) => [assertion.id, assertion]));

    return {
      source,
      versions,
      documents,
      chunks,
      linkedAssertions: assertionLinks.flatMap<LinkedAssertion>((link) => {
        const assertion = assertionsById.get(link.assertionId);

        return assertion ? [{ ...assertion, link }] : [];
      }),
      error: null,
    };
  } catch (error) {
    return {
      source: null,
      versions: [],
      documents: [],
      chunks: [],
      linkedAssertions: [],
      error: error instanceof Error ? error.message : "source_detail.repository_error",
    };
  }
}

function SourceDetailShell({
  title,
  description = "Inspect source health, versions, content, and linked assertions.",
  status,
  actions,
  children,
}: {
  title: string;
  description?: string;
  status: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={title} description={description} status={status}>
        {actions}
      </PageHeader>
      {children}
    </section>
  );
}

function SourceDetailMetrics({
  versions,
  documents,
  chunks,
  linkedAssertions,
}: {
  versions: readonly RadarSourceVersionDetail[];
  documents: readonly RadarSourceDocumentDetail[];
  chunks: readonly RadarSourceChunk[];
  linkedAssertions: readonly LinkedAssertion[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Versions"
        value={versions.length}
        helperText="Recent source snapshots."
        statusLabel="History"
      />
      <MetricCard
        label="Documents"
        value={documents.length}
        helperText="Extracted records for retrieval."
        statusLabel="Evidence"
      />
      <MetricCard
        label="Preview chunks"
        value={chunks.length}
        helperText="Latest indexed text excerpts shown below."
        statusLabel="Content"
      />
      <MetricCard
        label="Linked assertions"
        value={linkedAssertions.length}
        helperText="Business truths that depend on this source."
        statusLabel="Impact"
      />
    </div>
  );
}

function SourceOverview({
  source,
  documents,
}: {
  source: NonNullable<Awaited<ReturnType<typeof getSourceById>>>;
  documents: readonly RadarSourceDocumentDetail[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
        <CardHeader>
          <CardTitle>Source health</CardTitle>
          <CardDescription>Operational context for the current evidence input.</CardDescription>
          <CardAction>
            <StatusBadge tone={sourceSyncStatusTone(source.syncStatus)} label={sourceSyncStatusLabel(source.syncStatus)} />
          </CardAction>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 text-sm md:grid-cols-2">
            <DetailItem label="Type" value={sourceTypeLabel(source.type)} />
            <DetailItem label="Last sync" value={formatSourceTimestamp(source.lastSyncedAt)} />
            <DetailItem label="Origin" value={source.originUri ?? "No origin captured"} />
            <DetailItem label="Content hash" value={source.contentHash ?? "No hash captured"} mono />
          </dl>
        </CardContent>
      </Card>
      <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
        <CardHeader>
          <CardTitle>Latest documents</CardTitle>
          <CardDescription>Newest extracted records from this source.</CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <div className="flex flex-col gap-3">
              {documents.slice(0, 4).map((document) => (
                <div key={document.id} className="flex min-w-0 flex-col gap-1 rounded-md border bg-background p-3">
                  <span className="truncate text-sm font-medium text-foreground">{document.title}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {document.mimeType ?? "Unknown type"} · {document.byteSize ?? 0} bytes
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No extracted documents have been captured yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SourceVersionTable({ versions }: { versions: readonly RadarSourceVersionDetail[] }) {
  if (versions.length === 0) {
    return (
      <EmptyState
        title="No source versions yet"
        description="Versions appear after Radar successfully syncs or extracts this source."
        details={["Version number", "Document count", "Chunk count"]}
      />
    );
  }

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>Version history</CardTitle>
        <CardDescription>Recent snapshots and extraction health for this source.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-(--card-spacing)">Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Chunks</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="pr-(--card-spacing)">Hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((version) => (
              <TableRow key={version.id}>
                <TableCell className="pl-(--card-spacing)">v{version.versionNumber}</TableCell>
                <TableCell>
                  <StatusBadge tone={sourceSyncStatusTone(version.syncStatus)} label={sourceSyncStatusLabel(version.syncStatus)} />
                </TableCell>
                <TableCell>{version.documentCount}</TableCell>
                <TableCell>{version.chunkCount}</TableCell>
                <TableCell>{formatSourceTimestamp(version.createdAt)}</TableCell>
                <TableCell className="max-w-48 truncate pr-(--card-spacing) font-mono text-xs">
                  {version.contentHash}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function SourceContentPreview({
  chunks,
  documents,
}: {
  chunks: readonly RadarSourceChunk[];
  documents: readonly RadarSourceDocumentDetail[];
}) {
  const documentsById = new Map(documents.map((document) => [document.id, document]));

  if (chunks.length === 0) {
    return (
      <EmptyState
        title="No extracted content preview yet"
        description="Content previews appear after source text has been extracted and chunked for evidence retrieval."
        details={["Chunk index", "Token estimate", "Content hash"]}
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {chunks.map((chunk) => {
        const document = documentsById.get(chunk.sourceDocumentId);

        return (
          <EvidenceSnippet
            key={chunk.id}
            title={`Chunk ${chunk.chunkIndex + 1}`}
            source={document?.title ?? "Source document"}
            confidenceLabel={chunk.tokenCount ? `${chunk.tokenCount} tokens` : undefined}
          >
            <p>{boundedChunkPreview(chunk.content)}</p>
            <Separator className="my-3" />
            <p className="font-mono text-xs">Hash: {chunk.contentHash}</p>
          </EvidenceSnippet>
        );
      })}
    </div>
  );
}

function LinkedAssertions({ assertions }: { assertions: readonly LinkedAssertion[] }) {
  if (assertions.length === 0) {
    return (
      <EmptyState
        title="No assertions are linked yet"
        description="This source will affect assertions after it is attached to a customer-facing business truth."
        details={["Assertion", "Purpose", "Required source"]}
      />
    );
  }

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>Affected assertions</CardTitle>
        <CardDescription>Business truths that should react when this source changes.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-(--card-spacing)">Assertion</TableHead>
              <TableHead>Runner</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-(--card-spacing)">Source role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assertions.map((assertion) => (
              <TableRow key={assertion.id}>
                <TableCell className="pl-(--card-spacing)">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="max-w-72 truncate font-medium text-foreground">{assertion.title}</span>
                    <span className="max-w-72 truncate text-muted-foreground">{assertion.link.purpose ?? assertion.purpose}</span>
                  </div>
                </TableCell>
                <TableCell>{assertion.runnerType}</TableCell>
                <TableCell>{assertion.priority}</TableCell>
                <TableCell>
                  <Badge variant="outline">{assertion.status}</Badge>
                </TableCell>
                <TableCell className="pr-(--card-spacing)">
                  {assertion.link.isRequired ? "Required" : "Supporting"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function DetailItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "truncate font-mono text-xs text-foreground" : "truncate font-medium text-foreground"}>
        {isExternalUrl(value) ? (
          <a href={value} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-1 underline-offset-4 hover:underline">
            <span className="truncate">{value}</span>
            <ExternalLinkIcon />
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function boundedChunkPreview(content: string) {
  return content.length <= 900 ? content : `${content.slice(0, 897)}...`;
}

function isExternalUrl(value: string) {
  return value.startsWith("https://") || value.startsWith("http://");
}

function sourceHealthDescription(status: string) {
  if (status === "error") {
    return "Review the latest sync issue and re-sync after correcting the source input.";
  }

  if (status === "synced" || status === "ready") {
    return "This source is available as evidence for linked customer-facing assertions.";
  }

  return "Inspect source setup, sync state, and linked assertions.";
}

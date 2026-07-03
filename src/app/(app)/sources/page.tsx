import Link from "next/link";
import type { Metadata } from "next";
import { PlusIcon } from "lucide-react";

import { PageHeader } from "@/components/app-shell";
import { EmptyState, ErrorState, MetricCard } from "@/components/radar";
import { SourceCard, SourceList, type SourceListItem } from "@/components/sources";
import { Button } from "@/components/ui/button";
import { listSourceAssertionCounts, listSources } from "@/lib/repositories";
import { getAppRouteByHref } from "@/lib/radar-routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { membershipCan } from "@/lib/workspaces/permissions";
import { requireActiveWorkspace } from "@/lib/workspaces/server";

const route = getAppRouteByHref("/sources");

export const metadata: Metadata = {
  title: "Sources | Radar",
};

export default async function SourcesPage() {
  const membership = await requireActiveWorkspace();
  const supabase = await createSupabaseServerClient();
  const canCreateSource = membershipCan(membership, "source:create");
  const canEditSource = membershipCan(membership, "source:edit");

  if (!supabase) {
    return (
      <SourcesPageShell canCreateSource={canCreateSource}>
        <ErrorState
          title="Sources could not load"
          description="Supabase is not configured for this environment, so Radar cannot read workspace sources."
          reference="sources.supabase_unconfigured"
        />
      </SourcesPageShell>
    );
  }

  const sourceResult = await loadSourceListItems(supabase, membership.workspace.id);

  if (sourceResult.error) {
    return (
      <SourcesPageShell canCreateSource={canCreateSource}>
        <ErrorState
          title="Sources could not load"
          description="Radar could not read source records for the active workspace. Refresh after checking database connectivity and workspace permissions."
          reference={sourceResult.error}
        />
      </SourcesPageShell>
    );
  }

  const sourceItems = sourceResult.sources;

  return (
    <SourcesPageShell sourceCount={sourceItems.length} canCreateSource={canCreateSource}>
      <SourceMetrics sources={sourceItems} />
      {sourceItems.length > 0 ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {sourceItems.map((source) => (
              <SourceCard key={source.id} source={source} canEdit={canEditSource} />
            ))}
          </div>
          <SourceList sources={sourceItems} canEdit={canEditSource} />
        </>
      ) : (
        <EmptyState
          title="No sources are connected yet"
          description="Sources appear after a customer-facing assertion needs evidence from a URL, uploaded document, manual policy text, API endpoint, or support bot endpoint."
          details={["Source type", "Sync health", "Affected assertions"]}
          action={canCreateSource ? <AddSourceButton /> : undefined}
        />
      )}
    </SourcesPageShell>
  );
}

async function loadSourceListItems(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  workspaceId: string,
) {
  try {
    const [sources, assertionCounts] = await Promise.all([
      listSources(supabase, workspaceId),
      listSourceAssertionCounts(supabase, workspaceId),
    ]);

    return {
      sources: sources.map<SourceListItem>((source) => ({
        ...source,
        affectedAssertionCount: assertionCounts[source.id] ?? 0,
      })),
      error: null,
    };
  } catch (error) {
    return {
      sources: [],
      error: error instanceof Error ? error.message : "sources.repository_error",
    };
  }
}

function SourcesPageShell({
  children,
  sourceCount,
  canCreateSource = false,
}: {
  children: React.ReactNode;
  sourceCount?: number;
  canCreateSource?: boolean;
}) {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title={route?.title ?? "Sources"}
        description={route?.description ?? ""}
        status={typeof sourceCount === "number" ? `${sourceCount} sources` : undefined}
      >
        {canCreateSource ? <AddSourceButton /> : null}
      </PageHeader>
      {children}
    </section>
  );
}

function AddSourceButton() {
  return (
    <Button asChild>
      <Link href="/sources/new">
        <PlusIcon data-icon="inline-start" />
        Add source
      </Link>
    </Button>
  );
}

function SourceMetrics({ sources }: { sources: readonly SourceListItem[] }) {
  const readySourceCount = sources.filter((source) => ["ready", "synced"].includes(source.syncStatus)).length;
  const needsAttentionCount = sources.filter((source) => source.syncStatus === "error").length;
  const affectedAssertionCount = sources.reduce((total, source) => total + source.affectedAssertionCount, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Connected sources"
        value={sources.length}
        helperText="Evidence inputs scoped to this workspace."
        statusLabel="Workspace"
      />
      <MetricCard
        label="Ready sources"
        value={readySourceCount}
        helperText="Inputs ready for assertion runs."
        tone={readySourceCount > 0 ? "pass" : "neutral"}
        statusLabel="Sync"
      />
      <MetricCard
        label="Needs attention"
        value={needsAttentionCount}
        helperText="Sources with ingestion errors."
        tone={needsAttentionCount > 0 ? "fail" : "pass"}
        statusLabel={needsAttentionCount > 0 ? "Review" : "Clear"}
      />
      <MetricCard
        label="Affected assertions"
        value={affectedAssertionCount}
        helperText="Assertion links that should react to source changes."
        statusLabel="Impact"
      />
    </div>
  );
}

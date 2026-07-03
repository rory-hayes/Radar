import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { PageHeader } from "@/components/app-shell";
import { ErrorState } from "@/components/radar";
import { SourceForm } from "@/components/sources";
import { Button } from "@/components/ui/button";
import { getSourceById } from "@/lib/repositories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveWorkspace } from "@/lib/workspaces/server";

export const metadata: Metadata = {
  title: "Edit Source | Radar",
};

type EditSourcePageProps = {
  params: Promise<{
    sourceId: string;
  }>;
};

export default async function EditSourcePage({ params }: EditSourcePageProps) {
  const { sourceId } = await params;

  if (!isUuid(sourceId)) {
    notFound();
  }

  const membership = await requireActiveWorkspace();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <section className="flex flex-col gap-6">
        <SourceEditHeader />
        <ErrorState
          title="Source could not load"
          description="Supabase is not configured for this environment, so Radar cannot read workspace sources."
          reference="sources.supabase_unconfigured"
        />
      </section>
    );
  }

  const source = await getSourceById(supabase, membership.workspace.id, sourceId);

  if (!source) {
    notFound();
  }

  return (
    <section className="flex flex-col gap-6">
      <SourceEditHeader sourceName={source.name} />
      <div className="max-w-3xl">
        <SourceForm mode="edit" source={source} />
      </div>
    </section>
  );
}

function SourceEditHeader({ sourceName }: { sourceName?: string }) {
  return (
    <PageHeader
      title="Edit source"
      description={sourceName ? `Update ${sourceName} without changing workspace ownership.` : "Update a workspace-owned source."}
      status="Source setup"
    >
      <Button asChild variant="outline">
        <Link href="/sources">
          <ArrowLeftIcon data-icon="inline-start" />
          Sources
        </Link>
      </Button>
    </PageHeader>
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

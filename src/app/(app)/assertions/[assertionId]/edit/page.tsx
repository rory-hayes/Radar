import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { AssertionForm } from "@/components/assertions";
import { PageHeader } from "@/components/app-shell";
import { ErrorState } from "@/components/radar";
import { Button } from "@/components/ui/button";
import {
  getAssertionById,
  listAssertionRunSchedules,
  listAssertionSourcesForAssertion,
  listSources,
} from "@/lib/repositories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireWorkspacePermission } from "@/lib/workspaces/guards";

export const metadata: Metadata = {
  title: "Edit Assertion | Radar",
};

type EditAssertionPageProps = {
  params: Promise<{
    assertionId: string;
  }>;
};

export default async function EditAssertionPage({ params }: EditAssertionPageProps) {
  const { assertionId } = await params;

  if (!isUuid(assertionId)) {
    notFound();
  }

  const membership = await requireWorkspacePermission("assertion:edit");
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <section className="flex flex-col gap-6">
        <AssertionEditHeader />
        <ErrorState
          title="Assertion could not load"
          description="Supabase is not configured for this environment, so Radar cannot read workspace assertions."
          reference="assertions.supabase_unconfigured"
        />
      </section>
    );
  }

  const [assertion, sources, sourceLinks, schedules] = await Promise.all([
    getAssertionById(supabase, membership.workspace.id, assertionId),
    listSources(supabase, membership.workspace.id),
    listAssertionSourcesForAssertion(supabase, membership.workspace.id, assertionId),
    listAssertionRunSchedules(supabase, membership.workspace.id),
  ]);

  if (!assertion) {
    notFound();
  }

  return (
    <section className="flex flex-col gap-6">
      <AssertionEditHeader assertionTitle={assertion.title} />
      <div className="max-w-4xl">
        <AssertionForm
          mode="edit"
          assertion={assertion}
          sources={sources}
          linkedSourceIds={sourceLinks.map((link) => link.sourceId)}
          schedule={schedules.find((schedule) => schedule.assertionId === assertion.id)}
        />
      </div>
    </section>
  );
}

function AssertionEditHeader({ assertionTitle }: { assertionTitle?: string }) {
  return (
    <PageHeader
      title="Edit assertion"
      description={assertionTitle ? `Update ${assertionTitle} without changing workspace ownership.` : "Update a workspace-owned assertion."}
      status="Assertion setup"
    >
      <Button asChild variant="outline">
        <Link href="/assertions">
          <ArrowLeftIcon data-icon="inline-start" />
          Assertions
        </Link>
      </Button>
    </PageHeader>
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}

import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeftIcon } from "lucide-react";

import { AssertionForm } from "@/components/assertions";
import { PageHeader } from "@/components/app-shell";
import { ErrorState } from "@/components/radar";
import { Button } from "@/components/ui/button";
import { listSources } from "@/lib/repositories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireWorkspacePermission } from "@/lib/workspaces/guards";

export const metadata: Metadata = {
  title: "Create Assertion | Radar",
};

export default async function NewAssertionPage() {
  const membership = await requireWorkspacePermission("assertion:create");
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <section className="flex flex-col gap-6">
        <AssertionCreateHeader />
        <ErrorState
          title="Assertion form could not load"
          description="Supabase is not configured for this environment, so Radar cannot load evidence sources."
          reference="assertions.supabase_unconfigured"
        />
      </section>
    );
  }

  const sources = await listSources(supabase, membership.workspace.id);

  return (
    <section className="flex flex-col gap-6">
      <AssertionCreateHeader />
      <div className="max-w-4xl">
        <AssertionForm mode="create" sources={sources} />
      </div>
    </section>
  );
}

function AssertionCreateHeader() {
  return (
    <PageHeader
      title="Create assertion"
      description="Define the customer-facing truth Radar should verify before connecting unnecessary systems."
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

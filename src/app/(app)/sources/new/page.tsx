import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeftIcon } from "lucide-react";

import { PageHeader } from "@/components/app-shell";
import { SourceForm } from "@/components/sources";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Add Source | Radar",
};

export default function NewSourcePage() {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Add source"
        description="Create one workspace-owned evidence input for assertions that need it."
        status="Source setup"
      >
        <Button asChild variant="outline">
          <Link href="/sources">
            <ArrowLeftIcon data-icon="inline-start" />
            Sources
          </Link>
        </Button>
      </PageHeader>
      <div className="max-w-3xl">
        <SourceForm mode="create" />
      </div>
    </section>
  );
}

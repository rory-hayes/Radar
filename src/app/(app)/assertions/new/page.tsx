import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeftIcon } from "lucide-react";

import { AssertionForm, AssertionTemplatePicker } from "@/components/assertions";
import { PageHeader } from "@/components/app-shell";
import { ErrorState } from "@/components/radar";
import { Button } from "@/components/ui/button";
import {
  getV1AssertionTemplate,
  v1AssertionPackSlugs,
  type V1AssertionPackSlug,
} from "@/lib/assertions/templates";
import { listSources } from "@/lib/repositories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireWorkspacePermission } from "@/lib/workspaces/guards";

export const metadata: Metadata = {
  title: "Create Assertion | Radar",
};

type NewAssertionPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewAssertionPage({ searchParams }: NewAssertionPageProps) {
  const membership = await requireWorkspacePermission("assertion:create");
  const supabase = await createSupabaseServerClient();
  const selectedTemplateSlug = templateSlugFromSearchParams((await searchParams) ?? {});
  const selectedTemplate = getV1AssertionTemplate(selectedTemplateSlug);

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
      <AssertionTemplatePicker selectedSlug={selectedTemplate?.slug} />
      <div className="max-w-4xl">
        <AssertionForm
          mode="create"
          sources={sources}
          template={
            selectedTemplate
              ? {
                  title: selectedTemplate.titleTemplate,
                  purpose: selectedTemplate.purposeTemplate,
                  expectedBehavior: selectedTemplate.expectedBehaviorTemplate,
                  category: selectedTemplate.category,
                  priority: selectedTemplate.priority,
                  runnerType: selectedTemplate.runnerType,
                }
              : undefined
          }
        />
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

function templateSlugFromSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  const value = searchParams.template;
  const slug = Array.isArray(value) ? value[0] : value;

  return isV1AssertionPackSlug(slug) ? slug : undefined;
}

function isV1AssertionPackSlug(value?: string): value is V1AssertionPackSlug {
  return typeof value === "string" && (v1AssertionPackSlugs as readonly string[]).includes(value);
}

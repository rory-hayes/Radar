import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";

import {
  AssertionDetailView,
  type AssertionFailedTestCaseRerunCandidate,
  type AssertionLinkedSource,
} from "@/components/assertions";
import { PageHeader } from "@/components/app-shell";
import { ErrorState } from "@/components/radar";
import { Button } from "@/components/ui/button";
import type { RadarTestCase } from "@/lib/assertions/schema";
import { loadKnowledgeTargetConfigurationsForAssertion } from "@/lib/evaluation/knowledge-targets";
import {
  getAssertionById,
  listAssertionRunSchedules,
  listAssertionSourcesForAssertion,
  listEvaluationRunSummariesForAssertion,
  listFindingsForAssertion,
  listSources,
  listTestCasesForAssertion,
  listTestCaseResultsForRun,
} from "@/lib/repositories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { membershipCan } from "@/lib/workspaces/permissions";
import { requireActiveWorkspace } from "@/lib/workspaces/server";

type AssertionDetailPageProps = {
  params: Promise<{
    assertionId: string;
  }>;
};

export const metadata: Metadata = {
  title: "Assertion detail | Radar",
};

export default async function AssertionDetailPage({ params }: AssertionDetailPageProps) {
  const { assertionId } = await params;
  const membership = await requireActiveWorkspace();
  const supabase = await createSupabaseServerClient();
  const canEditAssertion = membershipCan(membership, "assertion:edit");
  const canRunAssertion = membershipCan(membership, "run:rerun");

  if (!supabase) {
    return (
      <AssertionDetailShell title="Assertion detail" status="Unavailable">
        <ErrorState
          title="Assertion could not load"
          description="Supabase is not configured for this environment, so Radar cannot read this assertion."
          reference="assertion_detail.supabase_unconfigured"
        />
      </AssertionDetailShell>
    );
  }

  const detail = await loadAssertionDetail(supabase, membership.workspace.id, assertionId);

  if (detail.error) {
    return (
      <AssertionDetailShell title="Assertion detail" status="Error">
        <ErrorState
          title="Assertion could not load"
          description="Radar could not read assertion detail records for the active workspace. Refresh after checking database connectivity and workspace permissions."
          reference={detail.error}
        />
      </AssertionDetailShell>
    );
  }

  if (!detail.assertion) {
    notFound();
  }

  const assertion = detail.assertion;

  return (
    <AssertionDetailShell
      title={assertion.title}
      description={assertion.purpose}
      status={`${detail.testCases.length} test cases`}
      actions={
        <>
          <Button asChild variant="outline">
            <Link href="/assertions">
              <ArrowLeftIcon data-icon="inline-start" />
              Assertions
            </Link>
          </Button>
          {canEditAssertion ? (
            <Button asChild>
              <Link href={`/assertions/${assertion.id}/edit`}>
                <PencilIcon data-icon="inline-start" />
                Edit
              </Link>
            </Button>
          ) : null}
        </>
      }
    >
      <AssertionDetailView
        assertion={assertion}
        schedule={detail.schedule}
        availableSources={detail.availableSources}
        linkedSources={detail.linkedSources}
        testCases={detail.testCases}
        runHistory={detail.runHistory}
        failedTestCaseRerunCandidates={detail.failedTestCaseRerunCandidates}
        findings={detail.findings}
        knowledgeTargets={detail.knowledgeTargets}
        canEditSources={canEditAssertion}
        canEditTestCases={canEditAssertion}
        canRunAssertions={canRunAssertion}
      />
    </AssertionDetailShell>
  );
}

async function loadAssertionDetail(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  workspaceId: string,
  assertionId: string,
) {
  try {
    const assertion = await getAssertionById(supabase, workspaceId, assertionId);

    if (!assertion) {
      return {
        assertion,
        schedule: undefined,
        availableSources: [],
        linkedSources: [],
        testCases: [],
        runHistory: [],
        failedTestCaseRerunCandidates: [],
        findings: [],
        knowledgeTargets: undefined,
        error: null,
      };
    }

    const [schedules, sourceLinks, sources, testCases, runHistory, findings, knowledgeTargets] = await Promise.all([
      listAssertionRunSchedules(supabase, workspaceId),
      listAssertionSourcesForAssertion(supabase, workspaceId, assertionId),
      listSources(supabase, workspaceId),
      listTestCasesForAssertion(supabase, workspaceId, assertionId),
      listEvaluationRunSummariesForAssertion(supabase, workspaceId, assertionId, { limit: 8 }),
      listFindingsForAssertion(supabase, workspaceId, assertionId, { limit: 8 }),
      loadKnowledgeTargetConfigurationsForAssertion(supabase, { workspaceId, assertionId }),
    ]);
    const sourcesById = new Map(sources.map((source) => [source.id, source]));
    const latestFailedRun = runHistory.find((run) => run.failedCount + run.errorCount > 0);
    const failedTestCaseRerunCandidates = latestFailedRun
      ? await loadFailedTestCaseRerunCandidates(supabase, workspaceId, latestFailedRun.id, testCases)
      : [];

    return {
      assertion,
      schedule: schedules.find((schedule) => schedule.assertionId === assertionId),
      availableSources: sources,
      linkedSources: sourceLinks.flatMap<AssertionLinkedSource>((link) => {
        const source = sourcesById.get(link.sourceId);

        return source ? [{ ...source, link }] : [];
      }),
      testCases,
      runHistory,
      failedTestCaseRerunCandidates,
      findings,
      knowledgeTargets,
      error: null,
    };
  } catch (error) {
    return {
      assertion: null,
      schedule: undefined,
      availableSources: [],
      linkedSources: [],
      testCases: [],
      runHistory: [],
      failedTestCaseRerunCandidates: [],
      findings: [],
      knowledgeTargets: undefined,
      error: error instanceof Error ? error.message : "assertion_detail.repository_error",
    };
  }
}

async function loadFailedTestCaseRerunCandidates(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  workspaceId: string,
  evaluationRunId: string,
  testCases: readonly RadarTestCase[],
): Promise<AssertionFailedTestCaseRerunCandidate[]> {
  const testCasesById = new Map(testCases.map((testCase) => [testCase.id, testCase]));
  const results = await listTestCaseResultsForRun(supabase, workspaceId, evaluationRunId);

  return results.flatMap<AssertionFailedTestCaseRerunCandidate>((result) => {
    if (result.status !== "failed" && result.status !== "error") {
      return [];
    }

    const testCase = testCasesById.get(result.testCaseId);

    if (!testCase || testCase.status !== "approved") {
      return [];
    }

    return [
      {
        id: testCase.id,
        title: testCase.title,
        latestRunId: evaluationRunId,
        latestResultStatus: result.status,
      },
    ];
  });
}

function AssertionDetailShell({
  title,
  description = "Inspect one assertion's configuration, evidence coverage, checks, runs, and findings.",
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

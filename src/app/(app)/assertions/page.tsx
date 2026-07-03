import type { Metadata } from "next";

import {
  AssertionTable,
  type AssertionListFilters,
  type AssertionListItem,
} from "@/components/assertions";
import { PageHeader } from "@/components/app-shell";
import { ErrorState, MetricCard } from "@/components/radar";
import {
  assertionCategories,
  assertionPriorities,
  assertionStatuses,
  runnerTypes,
  type AssertionCategory,
  type AssertionPriority,
  type AssertionStatus,
  type RunnerType,
} from "@/lib/assertions/schema";
import {
  listAssertionRunSchedules,
  listAssertions,
  listAssertionSourceCounts,
  listLatestEvaluationRunsForAssertions,
} from "@/lib/repositories";
import { getAppRouteByHref } from "@/lib/radar-routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveWorkspace } from "@/lib/workspaces/server";

const route = getAppRouteByHref("/assertions");
const pageSize = 10;

export const metadata: Metadata = {
  title: "Assertions | Radar",
};

type AssertionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AssertionsPage({ searchParams }: AssertionsPageProps) {
  const membership = await requireActiveWorkspace();
  const supabase = await createSupabaseServerClient();
  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = filtersFromSearchParams(resolvedSearchParams);
  const requestedPage = pageFromSearchParams(resolvedSearchParams);

  if (!supabase) {
    return (
      <AssertionsPageShell>
        <ErrorState
          title="Assertions could not load"
          description="Supabase is not configured for this environment, so Radar cannot read workspace assertions."
          reference="assertions.supabase_unconfigured"
        />
      </AssertionsPageShell>
    );
  }

  const assertionResult = await loadAssertionListItems(supabase, membership.workspace.id);

  if (assertionResult.error) {
    return (
      <AssertionsPageShell>
        <ErrorState
          title="Assertions could not load"
          description="Radar could not read assertions for the active workspace. Refresh after checking database connectivity and workspace permissions."
          reference={assertionResult.error}
        />
      </AssertionsPageShell>
    );
  }

  const filteredAssertions = filterAssertions(assertionResult.assertions, filters);
  const totalPages = Math.max(1, Math.ceil(filteredAssertions.length / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const paginatedAssertions = filteredAssertions.slice((page - 1) * pageSize, page * pageSize);

  return (
    <AssertionsPageShell assertionCount={assertionResult.assertions.length}>
      <AssertionMetrics assertions={assertionResult.assertions} />
      <AssertionTable
        assertions={paginatedAssertions}
        filters={filters}
        ownerOptions={ownerOptions(assertionResult.assertions)}
        totalAssertionCount={assertionResult.assertions.length}
        pagination={{
          page,
          pageSize,
          totalItems: filteredAssertions.length,
          totalPages,
        }}
      />
    </AssertionsPageShell>
  );
}

async function loadAssertionListItems(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  workspaceId: string,
) {
  try {
    const assertions = await listAssertions(supabase, workspaceId);
    const assertionIds = assertions.map((assertion) => assertion.id);
    const [sourceCounts, schedules, latestRuns] = await Promise.all([
      listAssertionSourceCounts(supabase, workspaceId),
      listAssertionRunSchedules(supabase, workspaceId),
      listLatestEvaluationRunsForAssertions(supabase, workspaceId, assertionIds),
    ]);
    const schedulesByAssertionId = new Map(schedules.map((schedule) => [schedule.assertionId, schedule]));

    return {
      assertions: assertions.map<AssertionListItem>((assertion) => ({
        ...assertion,
        sourceCount: sourceCounts[assertion.id] ?? 0,
        schedule: schedulesByAssertionId.get(assertion.id),
        latestRun: latestRuns[assertion.id],
      })),
      error: null,
    };
  } catch (error) {
    return {
      assertions: [],
      error: error instanceof Error ? error.message : "assertions.repository_error",
    };
  }
}

function AssertionsPageShell({
  children,
  assertionCount,
}: {
  children: React.ReactNode;
  assertionCount?: number;
}) {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title={route?.title ?? "Assertions"}
        description={route?.description ?? ""}
        status={typeof assertionCount === "number" ? `${assertionCount} assertions` : undefined}
      />
      {children}
    </section>
  );
}

function AssertionMetrics({ assertions }: { assertions: readonly AssertionListItem[] }) {
  const activeCount = assertions.filter((assertion) => assertion.status === "active").length;
  const criticalCount = assertions.filter((assertion) => assertion.priority === "critical").length;
  const sourceLinkedCount = assertions.filter((assertion) => assertion.sourceCount > 0).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Assertions"
        value={assertions.length}
        helperText="Customer-facing truths tracked in this workspace."
        statusLabel="Workspace"
      />
      <MetricCard
        label="Active"
        value={activeCount}
        helperText="Assertions eligible for scheduled or source-change runs."
        tone={activeCount > 0 ? "pass" : "neutral"}
        statusLabel="Status"
      />
      <MetricCard
        label="Critical"
        value={criticalCount}
        helperText="Highest-priority business truths."
        tone={criticalCount > 0 ? "warning" : "neutral"}
        statusLabel="Priority"
      />
      <MetricCard
        label="Source-linked"
        value={sourceLinkedCount}
        helperText="Assertions with evidence sources attached."
        tone={sourceLinkedCount > 0 ? "pass" : "neutral"}
        statusLabel="Coverage"
      />
    </div>
  );
}

function filtersFromSearchParams(searchParams: Record<string, string | string[] | undefined>): AssertionListFilters {
  const filters: AssertionListFilters = {};
  const query = stringParam(searchParams.q).trim();
  const status = enumParam(searchParams.status, assertionStatuses);
  const category = enumParam(searchParams.category, assertionCategories);
  const priority = enumParam(searchParams.priority, assertionPriorities);
  const runnerType = enumParam(searchParams.runnerType, runnerTypes);
  const owner = stringParam(searchParams.owner);

  if (query) {
    filters.q = query;
  }

  if (status) {
    filters.status = status;
  }

  if (category) {
    filters.category = category;
  }

  if (priority) {
    filters.priority = priority;
  }

  if (runnerType) {
    filters.runnerType = runnerType;
  }

  if (owner && owner !== "all") {
    filters.owner = owner;
  }

  return filters;
}

function pageFromSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  const page = Number.parseInt(stringParam(searchParams.page), 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function filterAssertions(assertions: readonly AssertionListItem[], filters: AssertionListFilters) {
  const query = filters.q?.toLowerCase();

  return assertions.filter((assertion) => {
    if (query && !assertionSearchText(assertion).includes(query)) {
      return false;
    }

    if (filters.status && assertion.status !== filters.status) {
      return false;
    }

    if (filters.category && assertion.category !== filters.category) {
      return false;
    }

    if (filters.priority && assertion.priority !== filters.priority) {
      return false;
    }

    if (filters.runnerType && assertion.runnerType !== filters.runnerType) {
      return false;
    }

    if (filters.owner === "unassigned" && assertion.ownerUserId) {
      return false;
    }

    if (filters.owner && filters.owner !== "unassigned" && assertion.ownerUserId !== filters.owner) {
      return false;
    }

    return true;
  });
}

function ownerOptions(assertions: readonly AssertionListItem[]) {
  const ownerIds = [...new Set(assertions.map((assertion) => assertion.ownerUserId).filter((id): id is string => Boolean(id)))];

  return ownerIds.map((ownerId) => ({
    value: ownerId,
    label: `User ${ownerId.slice(0, 8)}`,
  }));
}

function assertionSearchText(assertion: AssertionListItem) {
  return [
    assertion.title,
    assertion.purpose,
    assertion.expectedBehavior,
    assertion.ownerUserId,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function enumParam<TValue extends string>(
  value: string | string[] | undefined,
  allowedValues: readonly TValue[],
) {
  const normalizedValue = stringParam(value);
  return allowedValues.includes(normalizedValue as TValue) ? (normalizedValue as TValue) : undefined;
}

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

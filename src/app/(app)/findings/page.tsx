import type { Metadata } from "next";

import { PageHeader } from "@/components/app-shell";
import {
  FindingInbox,
  type FindingListFilters,
  type FindingListItem,
} from "@/components/findings";
import { ErrorState, MetricCard } from "@/components/radar";
import {
  type FindingSeverity,
  type FindingStatus,
  findingSeverities,
  findingStatuses,
} from "@/lib/findings/schema";
import { listAssertions, listFindings } from "@/lib/repositories";
import { getAppRouteByHref } from "@/lib/radar-routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveWorkspace } from "@/lib/workspaces/server";

const route = getAppRouteByHref("/findings");
const pageSize = 10;

export const metadata: Metadata = {
  title: "Findings | Radar",
};

type FindingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FindingsPage({ searchParams }: FindingsPageProps) {
  const membership = await requireActiveWorkspace();
  const supabase = await createSupabaseServerClient();
  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = filtersFromSearchParams(resolvedSearchParams);
  const requestedPage = pageFromSearchParams(resolvedSearchParams);

  if (!supabase) {
    return (
      <FindingsPageShell>
        <ErrorState
          title="Findings could not load"
          description="Supabase is not configured for this environment, so Radar cannot read workspace findings."
          reference="findings.supabase_unconfigured"
        />
      </FindingsPageShell>
    );
  }

  const findingResult = await loadFindingListItems(supabase, membership.workspace.id);

  if (findingResult.error) {
    return (
      <FindingsPageShell>
        <ErrorState
          title="Findings could not load"
          description="Radar could not read findings for the active workspace. Refresh after checking database connectivity and workspace permissions."
          reference={findingResult.error}
        />
      </FindingsPageShell>
    );
  }

  const filteredFindings = filterFindings(findingResult.findings, filters);
  const totalPages = Math.max(1, Math.ceil(filteredFindings.length / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const paginatedFindings = filteredFindings.slice((page - 1) * pageSize, page * pageSize);

  return (
    <FindingsPageShell findingCount={findingResult.findings.length}>
      <FindingMetrics findings={findingResult.findings} />
      <FindingInbox
        findings={paginatedFindings}
        filters={filters}
        ownerOptions={ownerOptions(findingResult.findings)}
        assertionOptions={assertionOptions(findingResult.findings)}
        totalFindingCount={findingResult.findings.length}
        pagination={{
          page,
          pageSize,
          totalItems: filteredFindings.length,
          totalPages,
        }}
      />
    </FindingsPageShell>
  );
}

async function loadFindingListItems(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  workspaceId: string,
) {
  try {
    const [findings, assertions] = await Promise.all([
      listFindings(supabase, workspaceId),
      listAssertions(supabase, workspaceId),
    ]);
    const assertionTitles = new Map(assertions.map((assertion) => [assertion.id, assertion.title]));

    return {
      findings: findings.map<FindingListItem>((finding) => ({
        ...finding,
        assertionTitle: assertionTitles.get(finding.assertionId),
      })),
      error: null,
    };
  } catch (error) {
    return {
      findings: [],
      error: error instanceof Error ? error.message : "findings.repository_error",
    };
  }
}

function FindingsPageShell({
  children,
  findingCount,
}: {
  children: React.ReactNode;
  findingCount?: number;
}) {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title={route?.title ?? "Findings"}
        description={route?.description ?? ""}
        status={typeof findingCount === "number" ? `${findingCount} findings` : undefined}
      />
      {children}
    </section>
  );
}

function FindingMetrics({ findings }: { findings: readonly FindingListItem[] }) {
  const openCount = findings.filter((finding) => finding.status === "open").length;
  const criticalCount = findings.filter((finding) => finding.severity === "critical").length;
  const unassignedCount = findings.filter((finding) => !finding.ownerUserId).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Findings"
        value={findings.length}
        helperText="Evidence-backed exceptions in this workspace."
        statusLabel="Inbox"
      />
      <MetricCard
        label="Open"
        value={openCount}
        helperText="Issues still requiring investigation or fix work."
        tone={openCount > 0 ? "fail" : "pass"}
        statusLabel={openCount > 0 ? "Review" : "Clear"}
      />
      <MetricCard
        label="Critical"
        value={criticalCount}
        helperText="Highest-severity customer-facing exceptions."
        tone={criticalCount > 0 ? "fail" : "pass"}
        statusLabel="Severity"
      />
      <MetricCard
        label="Unassigned"
        value={unassignedCount}
        helperText="Findings without a current owner."
        tone={unassignedCount > 0 ? "warning" : "pass"}
        statusLabel="Owner"
      />
    </div>
  );
}

function filtersFromSearchParams(searchParams: Record<string, string | string[] | undefined>): FindingListFilters {
  const filters: FindingListFilters = {};
  const query = stringParam(searchParams.q).trim();
  const severity = enumParam(searchParams.severity, findingSeverities);
  const status = enumParam(searchParams.status, findingStatuses);
  const owner = stringParam(searchParams.owner);
  const assertion = stringParam(searchParams.assertion);

  if (query) {
    filters.q = query;
  }

  if (severity) {
    filters.severity = severity;
  }

  if (status) {
    filters.status = status;
  }

  if (owner && owner !== "all") {
    filters.owner = owner;
  }

  if (assertion && assertion !== "all") {
    filters.assertion = assertion;
  }

  return filters;
}

function pageFromSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  const page = Number.parseInt(stringParam(searchParams.page), 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function filterFindings(findings: readonly FindingListItem[], filters: FindingListFilters) {
  const query = filters.q?.toLowerCase();

  return findings.filter((finding) => {
    if (query && !findingSearchText(finding).includes(query)) {
      return false;
    }

    if (filters.severity && finding.severity !== filters.severity) {
      return false;
    }

    if (filters.status && finding.status !== filters.status) {
      return false;
    }

    if (filters.owner === "unassigned" && finding.ownerUserId) {
      return false;
    }

    if (filters.owner && filters.owner !== "unassigned" && finding.ownerUserId !== filters.owner) {
      return false;
    }

    if (filters.assertion && finding.assertionId !== filters.assertion) {
      return false;
    }

    return true;
  });
}

function ownerOptions(findings: readonly FindingListItem[]) {
  const ownerIds = [...new Set(findings.map((finding) => finding.ownerUserId).filter((id): id is string => Boolean(id)))];

  return ownerIds.map((ownerId) => ({
    value: ownerId,
    label: `User ${ownerId.slice(0, 8)}`,
  }));
}

function assertionOptions(findings: readonly FindingListItem[]) {
  const assertionsById = new Map<string, string>();

  for (const finding of findings) {
    assertionsById.set(finding.assertionId, finding.assertionTitle ?? `Assertion ${finding.assertionId.slice(0, 8)}`);
  }

  return [...assertionsById.entries()]
    .sort(([, firstTitle], [, secondTitle]) => firstTitle.localeCompare(secondTitle))
    .map(([value, label]) => ({ value, label }));
}

function findingSearchText(finding: FindingListItem) {
  return [
    finding.title,
    finding.summary,
    finding.customerImpact,
    finding.recommendedFix,
    finding.ownerUserId,
    finding.assertionTitle,
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

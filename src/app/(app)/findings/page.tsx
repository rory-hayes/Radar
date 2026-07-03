import type { Metadata } from "next";

import { PageHeader } from "@/components/app-shell";
import {
  FindingDetailPanel,
  FindingInbox,
  type FindingListFilters,
  type FindingListItem,
} from "@/components/findings";
import { ErrorState, MetricCard } from "@/components/radar";
import {
  type FindingSeverity,
  type FindingOwnerTeam,
  type FindingStatus,
  findingOwnerTeams,
  findingSeverities,
  findingStatuses,
} from "@/lib/findings/schema";
import {
  listActiveWorkspaceMembers,
  listAssertions,
  listFindingActivity,
  listFindingEvidence,
  listFindings,
} from "@/lib/repositories";
import { getAppRouteByHref } from "@/lib/radar-routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveWorkspace } from "@/lib/workspaces/server";
import { membershipCan } from "@/lib/workspaces/permissions";

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
  const selectedFindingId = stringParam(resolvedSearchParams.finding);

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
  const selectedFinding = selectedFindingFromList(filteredFindings, paginatedFindings, selectedFindingId);
  const selectedDetail = selectedFinding
    ? await loadFindingDetail(supabase, membership.workspace.id, selectedFinding.id)
    : { evidence: [], activity: [], error: null };

  return (
    <FindingsPageShell findingCount={findingResult.findings.length}>
      <FindingMetrics findings={findingResult.findings} />
      {selectedDetail.error ? (
        <ErrorState
          title="Finding detail could not load"
          description="Radar could not read evidence or activity for the selected finding."
          reference={selectedDetail.error}
        />
      ) : null}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <FindingInbox
          findings={paginatedFindings}
          filters={filters}
          ownerOptions={ownerOptions(findingResult.findings)}
          teamOptions={teamOptions()}
          assertionOptions={assertionOptions(findingResult.findings)}
          totalFindingCount={findingResult.findings.length}
          selectedFindingId={selectedFinding?.id}
          pagination={{
            page,
            pageSize,
            totalItems: filteredFindings.length,
            totalPages,
          }}
        />
        <FindingDetailPanel
          finding={selectedFinding}
          evidence={selectedDetail.evidence}
          activity={selectedDetail.activity}
          canResolve={membershipCan(membership, "finding:resolve")}
          canRun={membershipCan(membership, "run:rerun")}
          ownerOptions={findingResult.memberOptions}
        />
      </div>
    </FindingsPageShell>
  );
}

async function loadFindingListItems(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  workspaceId: string,
) {
  try {
    const [findings, assertions, members] = await Promise.all([
      listFindings(supabase, workspaceId),
      listAssertions(supabase, workspaceId),
      listActiveWorkspaceMembers(supabase, workspaceId),
    ]);
    const assertionTitles = new Map(assertions.map((assertion) => [assertion.id, assertion.title]));

    return {
      findings: findings.map<FindingListItem>((finding) => ({
        ...finding,
        assertionTitle: assertionTitles.get(finding.assertionId),
        ownerTeam: ownerTeamFromMetadata(finding.metadata),
      })),
      memberOptions: members.map((member) => ({
        value: member.userId,
        label: `User ${member.userId.slice(0, 8)} (${member.role})`,
      })),
      error: null,
    };
  } catch (error) {
    return {
      findings: [],
      memberOptions: [],
      error: error instanceof Error ? error.message : "findings.repository_error",
    };
  }
}

async function loadFindingDetail(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  workspaceId: string,
  findingId: string,
) {
  try {
    const [evidence, activity] = await Promise.all([
      listFindingEvidence(supabase, workspaceId, findingId),
      listFindingActivity(supabase, workspaceId, findingId),
    ]);

    return { evidence, activity, error: null };
  } catch (error) {
    return {
      evidence: [],
      activity: [],
      error: error instanceof Error ? error.message : "findings.detail_repository_error",
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
  const team = enumParam(searchParams.team, findingOwnerTeams);
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

  if (team) {
    filters.team = team;
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

    if (filters.team && finding.ownerTeam !== filters.team) {
      return false;
    }

    if (filters.assertion && finding.assertionId !== filters.assertion) {
      return false;
    }

    return true;
  });
}

function selectedFindingFromList(
  filteredFindings: readonly FindingListItem[],
  paginatedFindings: readonly FindingListItem[],
  selectedFindingId: string,
) {
  return filteredFindings.find((finding) => finding.id === selectedFindingId) ?? paginatedFindings[0] ?? filteredFindings[0];
}

function ownerOptions(findings: readonly FindingListItem[]) {
  const ownerIds = [...new Set(findings.map((finding) => finding.ownerUserId).filter((id): id is string => Boolean(id)))];

  return ownerIds.map((ownerId) => ({
    value: ownerId,
    label: `User ${ownerId.slice(0, 8)}`,
  }));
}

function teamOptions() {
  return findingOwnerTeams.map((team) => ({
    value: team,
    label: formatOwnerTeam(team),
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
    finding.ownerTeam,
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

function ownerTeamFromMetadata(metadata: unknown): FindingOwnerTeam | undefined {
  if (!metadata || typeof metadata !== "object" || !("ownerTeam" in metadata)) {
    return undefined;
  }

  const ownerTeam = (metadata as Record<string, unknown>).ownerTeam;
  return findingOwnerTeams.includes(ownerTeam as FindingOwnerTeam) ? (ownerTeam as FindingOwnerTeam) : undefined;
}

function formatOwnerTeam(team: FindingOwnerTeam) {
  return team === "ops" ? "Ops" : `${team.charAt(0).toUpperCase()}${team.slice(1)}`;
}

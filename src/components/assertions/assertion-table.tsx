import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";

import { EmptyState, SeverityBadge, StatusBadge, type StatusTone } from "@/components/radar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  assertionCategories,
  assertionPriorities,
  assertionStatuses,
  runnerTypes,
  type AssertionCategory,
  type AssertionPriority,
  type AssertionStatus,
  type RadarAssertion,
  type RunnerType,
} from "@/lib/assertions/schema";
import type { RadarAssertionRunSchedule, RadarEvaluationRunSummary } from "@/lib/repositories";

export type AssertionListFilters = {
  q?: string;
  status?: AssertionStatus;
  category?: AssertionCategory;
  priority?: AssertionPriority;
  runnerType?: RunnerType;
  owner?: string;
};

export type AssertionListItem = RadarAssertion & {
  sourceCount: number;
  schedule?: RadarAssertionRunSchedule;
  latestRun?: RadarEvaluationRunSummary;
};

export type AssertionPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

type OwnerOption = {
  value: string;
  label: string;
};

type AssertionTableProps = {
  assertions: readonly AssertionListItem[];
  filters: AssertionListFilters;
  pagination: AssertionPagination;
  ownerOptions: readonly OwnerOption[];
  totalAssertionCount: number;
  canEdit?: boolean;
};

const allFilterValue = "all";

export function AssertionTable({
  assertions,
  filters,
  pagination,
  ownerOptions,
  totalAssertionCount,
  canEdit = false,
}: AssertionTableProps) {
  const hasFilters = Object.values(filters).some(Boolean);

  if (totalAssertionCount === 0) {
    return (
      <EmptyState
        title="No assertions are being verified yet"
        description="Assertions appear here once the workspace defines customer-facing promises Radar should monitor."
        details={["Business truth", "Required sources", "Runner type"]}
      />
    );
  }

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>Assertion inventory</CardTitle>
        <CardDescription>
          Business truths scoped to this workspace, with source coverage and latest run context.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <AssertionFilters filters={filters} ownerOptions={ownerOptions} />
        {assertions.length > 0 ? (
          <AssertionRows assertions={assertions} canEdit={canEdit} />
        ) : (
          <EmptyState
            title="No assertions match these filters"
            description="Adjust the search or filters to find another monitored business truth."
            action={
              hasFilters ? (
                <Button asChild variant="outline" size="sm">
                  <Link href="/assertions">Clear filters</Link>
                </Button>
              ) : undefined
            }
          />
        )}
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Showing {pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1}-
          {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems}
        </p>
        <PaginationControls pagination={pagination} filters={filters} />
      </CardFooter>
    </Card>
  );
}

function AssertionFilters({
  filters,
  ownerOptions,
}: {
  filters: AssertionListFilters;
  ownerOptions: readonly OwnerOption[];
}) {
  return (
    <form action="/assertions" className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_repeat(5,minmax(8rem,10rem))_auto]">
      <label className="flex flex-col gap-1 text-sm font-medium">
        <span>Search</span>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={filters.q ?? ""} placeholder="Search assertions" className="pl-8" />
        </div>
      </label>
      <FilterSelect name="status" label="Status" value={filters.status} options={assertionStatuses} format={formatStatus} />
      <FilterSelect
        name="category"
        label="Category"
        value={filters.category}
        options={assertionCategories}
        format={formatCategory}
      />
      <FilterSelect
        name="priority"
        label="Priority"
        value={filters.priority}
        options={assertionPriorities}
        format={formatPriority}
      />
      <FilterSelect
        name="runnerType"
        label="Runner"
        value={filters.runnerType}
        options={runnerTypes}
        format={formatRunnerType}
      />
      <OwnerFilterSelect value={filters.owner} ownerOptions={ownerOptions} />
      <div className="flex items-end gap-2">
        <Button type="submit">Apply</Button>
        <Button asChild variant="outline">
          <Link href="/assertions">Reset</Link>
        </Button>
      </div>
    </form>
  );
}

function FilterSelect<TValue extends string>({
  name,
  label,
  value,
  options,
  format,
}: {
  name: string;
  label: string;
  value?: TValue;
  options: readonly TValue[];
  format: (value: TValue) => string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      <span>{label}</span>
      <Select name={name} defaultValue={value ?? allFilterValue}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={allFilterValue}>All</SelectItem>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {format(option)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </label>
  );
}

function OwnerFilterSelect({
  value,
  ownerOptions,
}: {
  value?: string;
  ownerOptions: readonly OwnerOption[];
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      <span>Owner</span>
      <Select name="owner" defaultValue={value ?? allFilterValue}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={allFilterValue}>All</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {ownerOptions.map((owner) => (
              <SelectItem key={owner.value} value={owner.value}>
                {owner.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </label>
  );
}

function AssertionRows({
  assertions,
  canEdit,
}: {
  assertions: readonly AssertionListItem[];
  canEdit: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Assertion</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Runner</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Schedule</TableHead>
          <TableHead className="text-right">Pass rate</TableHead>
          <TableHead>Last run</TableHead>
          <TableHead className="text-right">Sources</TableHead>
          {canEdit ? <TableHead className="text-right">Actions</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {assertions.map((assertion) => (
          <TableRow key={assertion.id}>
            <TableCell className="min-w-80 whitespace-normal">
              <div className="flex flex-col gap-1">
                <Link href={`/assertions/${assertion.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                  {assertion.title}
                </Link>
                <span className="line-clamp-2 max-w-xl text-muted-foreground">{assertion.purpose}</span>
              </div>
            </TableCell>
            <TableCell>{formatCategory(assertion.category)}</TableCell>
            <TableCell>
              <StatusBadge tone={statusTone(assertion.status)} label={formatStatus(assertion.status)} />
            </TableCell>
            <TableCell>{formatRunnerType(assertion.runnerType)}</TableCell>
            <TableCell>
              <SeverityBadge severity={assertion.priority} label={formatPriority(assertion.priority)} />
            </TableCell>
            <TableCell>{formatOwner(assertion.ownerUserId)}</TableCell>
            <TableCell>{formatSchedule(assertion.schedule)}</TableCell>
            <TableCell className="text-right">{formatPassRate(assertion.latestRun)}</TableCell>
            <TableCell>{formatLastRun(assertion.latestRun)}</TableCell>
            <TableCell className="text-right">{assertion.sourceCount}</TableCell>
            {canEdit ? (
              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/assertions/${assertion.id}/edit`}>Edit</Link>
                </Button>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PaginationControls({
  pagination,
  filters,
}: {
  pagination: AssertionPagination;
  filters: AssertionListFilters;
}) {
  const previousPage = pagination.page > 1 ? pagination.page - 1 : null;
  const nextPage = pagination.page < pagination.totalPages ? pagination.page + 1 : null;

  return (
    <div className="flex items-center gap-2">
      <Button asChild={Boolean(previousPage)} variant="outline" size="sm" disabled={!previousPage}>
        {previousPage ? (
          <Link href={assertionPageHref(filters, previousPage)}>
            <ChevronLeftIcon data-icon="inline-start" />
            Previous
          </Link>
        ) : (
          <span>Previous</span>
        )}
      </Button>
      <span className="min-w-20 text-center text-sm text-muted-foreground">
        Page {pagination.totalPages === 0 ? 0 : pagination.page} of {pagination.totalPages}
      </span>
      <Button asChild={Boolean(nextPage)} variant="outline" size="sm" disabled={!nextPage}>
        {nextPage ? (
          <Link href={assertionPageHref(filters, nextPage)}>
            Next
            <ChevronRightIcon data-icon="inline-end" />
          </Link>
        ) : (
          <span>Next</span>
        )}
      </Button>
    </div>
  );
}

function assertionPageHref(filters: AssertionListFilters, page: number) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/assertions?${query}` : "/assertions";
}

function statusTone(status: AssertionStatus): StatusTone {
  const tones: Record<AssertionStatus, StatusTone> = {
    active: "pass",
    draft: "neutral",
    paused: "warning",
    archived: "neutral",
  };

  return tones[status];
}

function formatStatus(status: AssertionStatus) {
  return titleize(status);
}

function formatCategory(category: AssertionCategory) {
  return titleize(category.replace("_", " / "));
}

function formatPriority(priority: AssertionPriority) {
  return titleize(priority);
}

function formatRunnerType(runnerType: RunnerType) {
  return `${titleize(runnerType)} Runner`;
}

function formatOwner(ownerUserId?: string) {
  return ownerUserId ? `User ${ownerUserId.slice(0, 8)}` : "Unassigned";
}

function formatSchedule(schedule?: RadarAssertionRunSchedule) {
  if (!schedule) {
    return "Manual";
  }

  if (!schedule.isEnabled && !schedule.sourceChangeTrigger) {
    return "Manual";
  }

  if (schedule.sourceChangeTrigger && schedule.cadence === "manual") {
    return "Source change";
  }

  const cadence = titleize(schedule.cadence);
  return schedule.sourceChangeTrigger ? `${cadence} + source change` : cadence;
}

function formatPassRate(run?: RadarEvaluationRunSummary) {
  if (!run || typeof run.score !== "number") {
    return "No runs";
  }

  return `${Math.round(run.score * 100)}%`;
}

function formatLastRun(run?: RadarEvaluationRunSummary) {
  if (!run) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(run.completedAt ?? run.createdAt));
}

function titleize(value: string) {
  return value
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";

import {
  EmptyState,
  SeverityBadge,
  StatusBadge,
  type StatusTone,
} from "@/components/radar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
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
  findingSeverities,
  findingStatuses,
  type FindingSeverity,
  type FindingStatus,
  type RadarFinding,
} from "@/lib/findings/schema";

export type FindingListFilters = {
  q?: string;
  severity?: FindingSeverity;
  status?: FindingStatus;
  owner?: string;
  assertion?: string;
};

export type FindingListItem = RadarFinding & {
  assertionTitle?: string;
};

export type FindingPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

type FilterOption = {
  value: string;
  label: string;
};

type FindingInboxProps = {
  findings: readonly FindingListItem[];
  filters: FindingListFilters;
  pagination: FindingPagination;
  ownerOptions: readonly FilterOption[];
  assertionOptions: readonly FilterOption[];
  totalFindingCount: number;
};

const allFilterValue = "all";

export function FindingInbox({
  findings,
  filters,
  pagination,
  ownerOptions,
  assertionOptions,
  totalFindingCount,
}: FindingInboxProps) {
  const hasFilters = Object.values(filters).some(Boolean);

  if (totalFindingCount === 0) {
    return (
      <EmptyState
        title="No evidence-backed findings yet"
        description="Findings appear when a check detects a broken customer-facing promise with expected versus actual evidence."
        details={["Expected behavior", "Actual result", "Recommended fix"]}
      />
    );
  }

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>Finding inbox</CardTitle>
        <CardDescription>
          Evidence-backed exceptions prioritized by severity, owner, confidence, and affected assertion.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FindingFilters
          filters={filters}
          ownerOptions={ownerOptions}
          assertionOptions={assertionOptions}
        />
        {findings.length > 0 ? (
          <FindingRows findings={findings} />
        ) : (
          <EmptyState
            title="No findings match these filters"
            description="Adjust the search or filters to find another customer-facing exception."
            action={
              hasFilters ? (
                <Button asChild variant="outline" size="sm">
                  <Link href="/findings">Clear filters</Link>
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

function FindingFilters({
  filters,
  ownerOptions,
  assertionOptions,
}: {
  filters: FindingListFilters;
  ownerOptions: readonly FilterOption[];
  assertionOptions: readonly FilterOption[];
}) {
  return (
    <form action="/findings">
      <FieldGroup className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_repeat(4,minmax(8rem,11rem))_auto]">
        <Field>
          <FieldLabel htmlFor="finding-search">Search</FieldLabel>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="finding-search"
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="Search findings"
              className="pl-8"
            />
          </div>
        </Field>
        <FilterSelect
          name="severity"
          label="Severity"
          value={filters.severity}
          options={findingSeverities}
          format={formatSeverity}
        />
        <FilterSelect
          name="status"
          label="Status"
          value={filters.status}
          options={findingStatuses}
          format={formatStatus}
        />
        <OptionSelect
          name="owner"
          label="Owner"
          value={filters.owner}
          options={[
            { value: "unassigned", label: "Unassigned" },
            ...ownerOptions,
          ]}
        />
        <OptionSelect
          name="assertion"
          label="Assertion"
          value={filters.assertion}
          options={assertionOptions}
        />
        <div className="flex items-end gap-2">
          <Button type="submit">Apply</Button>
          <Button asChild variant="outline">
            <Link href="/findings">Reset</Link>
          </Button>
        </div>
      </FieldGroup>
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
    <Field>
      <FieldLabel>{label}</FieldLabel>
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
    </Field>
  );
}

function OptionSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value?: string;
  options: readonly FilterOption[];
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select name={name} defaultValue={value ?? allFilterValue}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={allFilterValue}>All</SelectItem>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}

function FindingRows({ findings }: { findings: readonly FindingListItem[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Finding</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Affected assertion</TableHead>
          <TableHead className="text-right">Confidence</TableHead>
          <TableHead>Customer impact</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {findings.map((finding) => (
          <TableRow key={finding.id}>
            <TableCell className="min-w-80 whitespace-normal">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-foreground">{finding.title}</span>
                <span className="line-clamp-2 max-w-xl text-muted-foreground">{finding.summary}</span>
              </div>
            </TableCell>
            <TableCell>
              <SeverityBadge severity={finding.severity} label={formatSeverity(finding.severity)} />
            </TableCell>
            <TableCell>
              <StatusBadge tone={statusTone(finding.status)} label={formatStatus(finding.status)} />
            </TableCell>
            <TableCell>{formatOwner(finding.ownerUserId)}</TableCell>
            <TableCell className="min-w-52 whitespace-normal">
              {finding.assertionTitle ? (
                <Link
                  href={`/assertions/${finding.assertionId}`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {finding.assertionTitle}
                </Link>
              ) : (
                <span className="text-muted-foreground">Assertion unavailable</span>
              )}
            </TableCell>
            <TableCell className="text-right">{formatConfidence(finding.confidence)}</TableCell>
            <TableCell className="min-w-80 whitespace-normal">
              <span className="line-clamp-3 text-muted-foreground">{finding.customerImpact}</span>
            </TableCell>
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
  pagination: FindingPagination;
  filters: FindingListFilters;
}) {
  const previousPage = pagination.page > 1 ? pagination.page - 1 : null;
  const nextPage = pagination.page < pagination.totalPages ? pagination.page + 1 : null;

  return (
    <div className="flex items-center gap-2">
      <Button asChild={Boolean(previousPage)} variant="outline" size="sm" disabled={!previousPage}>
        {previousPage ? (
          <Link href={findingPageHref(filters, previousPage)}>
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
          <Link href={findingPageHref(filters, nextPage)}>
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

function findingPageHref(filters: FindingListFilters, page: number) {
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
  return query ? `/findings?${query}` : "/findings";
}

function statusTone(status: FindingStatus): StatusTone {
  const tones: Record<FindingStatus, StatusTone> = {
    open: "fail",
    investigating: "warning",
    fixed: "pass",
    resolved: "pass",
    ignored: "neutral",
    false_positive: "neutral",
  };

  return tones[status];
}

function formatSeverity(severity: FindingSeverity) {
  return titleize(severity);
}

function formatStatus(status: FindingStatus) {
  return titleize(status);
}

function formatOwner(ownerUserId?: string) {
  return ownerUserId ? `User ${ownerUserId.slice(0, 8)}` : "Unassigned";
}

function formatConfidence(confidence: number) {
  return `${Math.round(confidence * 100)}%`;
}

function titleize(value: string) {
  return value
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

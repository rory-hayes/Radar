import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/radar/status-badge";
import { Button } from "@/components/ui/button";
import {
  formatSourceTimestamp,
  sourceSyncStatusLabel,
  sourceSyncStatusTone,
  sourceTypeLabel,
  type SourceListItem,
} from "@/components/sources/source-card";

type SourceListProps = {
  sources: readonly SourceListItem[];
  canEdit?: boolean;
};

export function SourceList({ sources, canEdit = false }: SourceListProps) {
  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>Source inventory</CardTitle>
        <CardDescription>
          Workspace-owned evidence inputs used by active customer-facing assertions.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-(--card-spacing)">Source</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last sync</TableHead>
              <TableHead className="text-right">Affected assertions</TableHead>
              <TableHead className="pr-(--card-spacing) text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source) => (
              <TableRow key={source.id}>
                <TableCell className="pl-(--card-spacing)">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="max-w-64 truncate font-medium text-foreground">{source.name}</span>
                    <span className="max-w-64 truncate text-muted-foreground">
                      {source.originUri ?? source.description ?? "No origin captured yet"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{sourceTypeLabel(source.type)}</TableCell>
                <TableCell>
                  <StatusBadge
                    tone={sourceSyncStatusTone(source.syncStatus)}
                    label={sourceSyncStatusLabel(source.syncStatus)}
                  />
                </TableCell>
                <TableCell>{formatSourceTimestamp(source.lastSyncedAt)}</TableCell>
                <TableCell className="text-right">
                  {source.affectedAssertionCount}
                </TableCell>
                <TableCell className="pr-(--card-spacing) text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/sources/${source.id}`}>View</Link>
                    </Button>
                    {canEdit ? (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/sources/${source.id}/edit`}>Edit</Link>
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

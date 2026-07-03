import { FileTextIcon, GlobeIcon, ServerIcon, UploadIcon } from "lucide-react";
import type { ComponentType } from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge, type StatusTone } from "@/components/radar/status-badge";
import { type RadarSource, type SourceSyncStatus, type SourceType } from "@/lib/sources/schema";

export type SourceListItem = RadarSource & {
  affectedAssertionCount: number;
};

type SourceCardProps = {
  source: SourceListItem;
};

const sourceTypeLabels: Record<SourceType, string> = {
  url: "URL",
  uploaded_document: "Uploaded document",
  manual_text: "Manual text",
  api_endpoint: "API endpoint",
  support_bot_endpoint: "Support bot endpoint",
};

const sourceTypeIcons: Record<SourceType, ComponentType> = {
  url: GlobeIcon,
  uploaded_document: UploadIcon,
  manual_text: FileTextIcon,
  api_endpoint: ServerIcon,
  support_bot_endpoint: ServerIcon,
};

const syncStatusLabels: Record<SourceSyncStatus, string> = {
  draft: "Draft",
  ready: "Ready",
  syncing: "Syncing",
  synced: "Synced",
  error: "Needs attention",
  paused: "Paused",
  archived: "Archived",
};

const syncStatusTones: Record<SourceSyncStatus, StatusTone> = {
  draft: "neutral",
  ready: "pass",
  syncing: "running",
  synced: "pass",
  error: "fail",
  paused: "warning",
  archived: "neutral",
};

export function SourceCard({ source }: SourceCardProps) {
  const SourceIcon = sourceTypeIcons[source.type];

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader className="border-b border-border/80 pb-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
            <SourceIcon />
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate">{source.name}</CardTitle>
            <CardDescription className="truncate">{sourceTypeLabels[source.type]}</CardDescription>
          </div>
        </div>
        <CardAction>
          <StatusBadge tone={syncStatusTones[source.syncStatus]} label={syncStatusLabels[source.syncStatus]} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">Last sync</dt>
            <dd className="font-medium text-foreground">{formatSourceTimestamp(source.lastSyncedAt)}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">Affected assertions</dt>
            <dd className="font-medium text-foreground">{source.affectedAssertionCount}</dd>
          </div>
          <div className="flex min-w-0 flex-col gap-1 sm:col-span-2">
            <dt className="text-muted-foreground">Evidence detail</dt>
            <dd className="truncate font-medium text-foreground">{source.originUri ?? source.contentHash ?? "No origin captured yet"}</dd>
          </div>
          {source.lastSyncError ? (
            <div className="flex min-w-0 flex-col gap-1 sm:col-span-2">
              <dt className="text-muted-foreground">Latest issue</dt>
              <dd className="truncate text-destructive">{source.lastSyncError}</dd>
            </div>
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}

export function sourceTypeLabel(type: SourceType) {
  return sourceTypeLabels[type];
}

export function sourceSyncStatusLabel(status: SourceSyncStatus) {
  return syncStatusLabels[status];
}

export function sourceSyncStatusTone(status: SourceSyncStatus) {
  return syncStatusTones[status];
}

export function formatSourceTimestamp(value?: string) {
  if (!value) {
    return "Not synced";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

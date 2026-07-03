import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  FileTextIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
} from "lucide-react";
import Link from "next/link";

import { EmptyState, StatusBadge } from "@/components/radar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type {
  CommandCenterRecentActivityItem,
  CommandCenterRecentActivityKind,
} from "@/lib/command-center/recent-activity";

type RecentActivityFeedProps = {
  activity: readonly CommandCenterRecentActivityItem[];
};

export function RecentActivityFeed({ activity }: RecentActivityFeedProps) {
  if (activity.length === 0) {
    return (
      <EmptyState
        title="No recent activity yet"
        description="Recent source syncs, completed assertion runs, finding updates, reruns, and trust reports appear here."
        details={["Source sync", "Run completed", "Finding lifecycle"]}
      />
    );
  }

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>What Radar has done recently across sources, assertions, findings, and reports.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col">
        {activity.map((item, index) => (
          <div key={item.id}>
            <ActivityRow item={item} />
            {index < activity.length - 1 ? <Separator className="my-4" /> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ActivityRow({ item }: { item: CommandCenterRecentActivityItem }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:items-start">
      <div className="flex size-8 items-center justify-center rounded-md border bg-background text-muted-foreground">
        {iconForKind(item.kind)}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">{item.title}</h2>
          <StatusBadge tone={item.tone} label={item.statusLabel} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <time dateTime={item.timestamp}>{formatActivityTime(item.timestamp)}</time>
          {item.metadata.map((detail) => (
            <span key={detail} className="rounded-sm bg-muted px-2 py-1">
              {detail}
            </span>
          ))}
        </div>
      </div>
      {item.href ? (
        <Button asChild variant="outline" size="sm" className="justify-self-start sm:justify-self-end">
          <Link href={item.href}>Open</Link>
        </Button>
      ) : null}
    </div>
  );
}

function iconForKind(kind: CommandCenterRecentActivityKind) {
  const iconClassName = "size-4";

  if (kind === "source_synced") return <RefreshCwIcon className={iconClassName} aria-hidden="true" />;
  if (kind === "source_sync_failed") return <AlertTriangleIcon className={iconClassName} aria-hidden="true" />;
  if (kind === "assertion_run_completed") return <ShieldCheckIcon className={iconClassName} aria-hidden="true" />;
  if (kind === "finding_opened") return <AlertTriangleIcon className={iconClassName} aria-hidden="true" />;
  if (kind === "finding_resolved") return <CheckCircle2Icon className={iconClassName} aria-hidden="true" />;
  if (kind === "finding_rerun") return <RotateCcwIcon className={iconClassName} aria-hidden="true" />;
  return <FileTextIcon className={iconClassName} aria-hidden="true" />;
}

function formatActivityTime(timestamp: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

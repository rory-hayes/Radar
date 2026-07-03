import Link from "next/link";
import { AlertCircleIcon, ExternalLinkIcon, Settings2Icon } from "lucide-react";

import { EmptyState, StatusBadge, type StatusTone } from "@/components/radar";
import {
  formatSourceTimestamp,
  sourceSyncStatusLabel,
  sourceSyncStatusTone,
  sourceTypeLabel,
} from "@/components/sources/source-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
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
import type {
  KnowledgeTargetConfiguration,
  KnowledgeTargetConfigurationSet,
  KnowledgeTargetKind,
  KnowledgeTargetReadiness,
} from "@/lib/evaluation/knowledge-targets";

type KnowledgeTargetConfigurationPanelProps = {
  configuration?: KnowledgeTargetConfigurationSet;
  canEdit: boolean;
};

export function KnowledgeTargetConfigurationPanel({
  configuration,
  canEdit,
}: KnowledgeTargetConfigurationPanelProps) {
  if (!configuration?.isKnowledgeRunner) {
    return null;
  }

  if (configuration.targets.length === 0) {
    return (
      <EmptyState
        title="No Knowledge Runner target configured"
        description="Attach a support bot endpoint, HTTP endpoint, uploaded answer set, or manual answer set before this assertion can test customer-facing answers."
        details={["AI support endpoint", "HTTP endpoint", "Uploaded answer set"]}
        action={
          canEdit ? (
            <Button asChild>
              <Link href="/sources/new">
                <Settings2Icon data-icon="inline-start" />
                Add target source
              </Link>
            </Button>
          ) : null
        }
      />
    );
  }

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <CardTitle>Knowledge target configuration</CardTitle>
        <CardDescription>
          Customer-facing answer targets linked to this assertion and ready for Knowledge Runner execution.
        </CardDescription>
        <CardAction>
          <StatusBadge
            tone={configuration.hasRunnableTarget ? "pass" : "warning"}
            label={`${configuration.readyTargetCount}/${configuration.targets.length} ready`}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-0">
        {!configuration.hasRunnableTarget ? (
          <div className="px-(--card-spacing)">
            <Alert>
              <AlertCircleIcon />
              <AlertTitle>No runnable target</AlertTitle>
              <AlertDescription>
                Complete at least one linked endpoint or answer-set source before queued Knowledge Runner jobs execute.
              </AlertDescription>
            </Alert>
          </div>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-(--card-spacing)">Target</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Run config</TableHead>
              <TableHead>Readiness</TableHead>
              <TableHead className="pr-(--card-spacing)">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configuration.targets.map((target) => (
              <KnowledgeTargetRow key={target.sourceId} target={target} canEdit={canEdit} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function KnowledgeTargetRow({ target, canEdit }: { target: KnowledgeTargetConfiguration; canEdit: boolean }) {
  return (
    <TableRow>
      <TableCell className="pl-(--card-spacing)">
        <div className="flex min-w-0 flex-col gap-1">
          <Link href={`/sources/${target.sourceId}`} className="font-medium text-foreground underline-offset-4 hover:underline">
            {target.name}
          </Link>
          <span className="line-clamp-2 max-w-xl text-sm text-muted-foreground">
            {target.purpose ?? target.description ?? "Configured as a Knowledge Runner target."}
          </span>
          {target.targetUri ? <span className="max-w-xl truncate font-mono text-xs text-muted-foreground">{target.targetUri}</span> : null}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span>{formatTargetKind(target.kind)}</span>
          <span className="text-sm text-muted-foreground">{sourceTypeLabel(target.sourceType)}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap items-center gap-2">
          {target.httpMethod ? <Badge variant="outline">{target.httpMethod}</Badge> : null}
          {target.authMode ? <Badge variant="secondary">{formatAuthMode(target.authMode)}</Badge> : null}
          <StatusBadge tone={sourceSyncStatusTone(target.syncStatus)} label={sourceSyncStatusLabel(target.syncStatus)} />
          <span className="text-sm text-muted-foreground">{formatSourceTimestamp(target.lastSyncedAt)}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex min-w-0 flex-col gap-1">
          <StatusBadge tone={readinessTone(target.readiness)} label={formatReadiness(target.readiness)} />
          <span className="line-clamp-2 max-w-xs text-sm text-muted-foreground">{target.notes[0]}</span>
        </div>
      </TableCell>
      <TableCell className="pr-(--card-spacing)">
        {canEdit ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/sources/${target.sourceId}/edit`}>
              <ExternalLinkIcon data-icon="inline-start" />
              Edit
            </Link>
          </Button>
        ) : (
          <Badge variant={target.isRequired ? "default" : "outline"}>{target.isRequired ? "Required" : "Supporting"}</Badge>
        )}
      </TableCell>
    </TableRow>
  );
}

function formatTargetKind(kind: KnowledgeTargetKind) {
  const labels: Record<KnowledgeTargetKind, string> = {
    ai_support_endpoint: "AI support endpoint",
    http_endpoint: "HTTP endpoint",
    uploaded_answer_set: "Uploaded answer set",
    manual_answer_set: "Manual answer set",
  };

  return labels[kind];
}

function formatAuthMode(authMode: NonNullable<KnowledgeTargetConfiguration["authMode"]>) {
  const labels: Record<NonNullable<KnowledgeTargetConfiguration["authMode"]>, string> = {
    none: "No auth",
    bearer: "Bearer",
    basic: "Basic",
    custom_header: "Custom header",
  };

  return labels[authMode];
}

function readinessTone(readiness: KnowledgeTargetReadiness): StatusTone {
  if (readiness === "ready") {
    return "pass";
  }

  if (readiness === "sync_error" || readiness === "unavailable") {
    return "fail";
  }

  return "warning";
}

function formatReadiness(readiness: KnowledgeTargetReadiness) {
  const labels: Record<KnowledgeTargetReadiness, string> = {
    ready: "Ready",
    needs_endpoint_url: "Needs endpoint",
    needs_synced_content: "Needs content",
    sync_error: "Sync error",
    unavailable: "Unavailable",
  };

  return labels[readiness];
}

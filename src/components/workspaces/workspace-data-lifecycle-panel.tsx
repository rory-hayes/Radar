import { DownloadIcon, ShieldCheckIcon } from "lucide-react";

import { StatusBadge } from "@/components/radar/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { type RadarWorkspace } from "@/lib/workspaces/schema";

type WorkspaceDataLifecyclePanelProps = {
  workspace: RadarWorkspace;
  canManage: boolean;
};

export function WorkspaceDataLifecyclePanel({ workspace, canManage }: WorkspaceDataLifecyclePanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data lifecycle</CardTitle>
        <CardDescription>Export workspace records and review the active retention window.</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Retention window</dt>
            <dd>
              <StatusBadge label={`${workspace.dataRetentionDays} days`} />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Export format</dt>
            <dd className="font-medium text-foreground">JSON</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Private artifacts</dt>
            <dd className="inline-flex items-center gap-1 font-medium text-foreground">
              <ShieldCheckIcon data-icon="inline-start" />
              Manifest only
            </dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="justify-end">
        {canManage ? (
          <Button asChild variant="outline">
            <a href="/api/workspace/export" download>
              <DownloadIcon data-icon="inline-start" />
              Export workspace
            </a>
          </Button>
        ) : (
          <Button variant="outline" disabled>
            <DownloadIcon data-icon="inline-start" />
            Export workspace
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

import type { Metadata } from "next";

import { PageHeader } from "@/components/app-shell";
import { StatusBadge } from "@/components/radar/status-badge";
import { WorkspaceBillingPanel } from "@/components/workspaces/workspace-billing-panel";
import { WorkspaceSettingsForm } from "@/components/workspaces/workspace-settings-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getWorkspaceBillingUsage } from "@/lib/billing/workspace-usage";
import { resolveRadarEnvironment } from "@/lib/env/schema";
import { settingsRoute } from "@/lib/radar-routes";
import { getBillingCustomerForWorkspace } from "@/lib/repositories";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { membershipCan } from "@/lib/workspaces/permissions";
import { requireActiveWorkspace } from "@/lib/workspaces/server";

export const metadata: Metadata = {
  title: "Settings | Radar",
};

export default async function SettingsPage() {
  const membership = await requireActiveWorkspace();
  const canManageWorkspace = membershipCan(membership, "workspace:manage");
  const radarEnvironment = resolveRadarEnvironment();
  const supabaseConfigured = isSupabaseConfigured();
  const supabase = await createSupabaseServerClient();
  const workspaceUsage = { assertions: 0, sources: 0, monthlyRuns: 0 };
  let billingCustomer = null;

  if (supabase) {
    const [customer, usage] = await Promise.all([
      getBillingCustomerForWorkspace(supabase, membership.workspace.id),
      getWorkspaceBillingUsage(supabase, membership.workspace.id),
    ]);

    billingCustomer = customer;
    workspaceUsage.assertions = usage.assertions;
    workspaceUsage.sources = usage.sources;
    workspaceUsage.monthlyRuns = usage.monthlyRuns;
  }

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={settingsRoute.title} description={settingsRoute.description} status="Hidden" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <div className="flex flex-col gap-4">
          <WorkspaceSettingsForm workspace={membership.workspace} canManage={canManageWorkspace} />
          <WorkspaceBillingPanel
            billingCustomer={billingCustomer}
            usage={workspaceUsage}
            canManage={canManageWorkspace}
          />
        </div>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Environment</CardTitle>
              <CardDescription>Operational context for this workspace.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Radar environment</span>
                <StatusBadge label={radarEnvironment} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Supabase auth</span>
                <StatusBadge label={supabaseConfigured ? "Configured" : "Local placeholder"} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Workspace status</span>
                <StatusBadge label={membership.workspace.status} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Access</CardTitle>
              <CardDescription>Role-aware controls without expanding into admin bloat.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Your role</span>
                <StatusBadge label={membership.role} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Profile updates</span>
                <StatusBadge label={canManageWorkspace ? "Allowed" : "Admin only"} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

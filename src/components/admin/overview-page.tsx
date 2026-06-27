import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Download,
  PlugZap,
  UploadCloud,
  Users,
  type LucideIcon,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-surfaces";
import { RadarOnboardingTour } from "@/components/admin/onboarding-tour";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminCollection, getAdminContext, type AdminRecord } from "@/lib/admin-data";

type OverviewPageProps = {
  onboardingAudience?: "admin" | "user";
};

const setupSteps = [
  {
    stage: "Knowledge",
    title: "Add workspace knowledge",
    body: "Upload policies, FAQs, and playbooks that Radar can cite.",
    href: "/app/uploads",
    action: "Upload",
    icon: UploadCloud,
  },
  {
    stage: "Connectors",
    title: "Connect source systems",
    body: "Prepare Drive, Confluence, Notion, CRM, and support syncs.",
    href: "/app/connectors",
    action: "Connect",
    icon: PlugZap,
  },
  {
    stage: "Users",
    title: "Invite users",
    body: "Bring teammates into this workspace and their setup flow.",
    href: "/app/users",
    action: "Invite",
    icon: Users,
  },
  {
    stage: "Extension",
    title: "Install Radar for calls",
    body: "Users run the Chrome extension during approved conversations.",
    href: "/app?onboarding=user",
    action: "Start setup",
    icon: Download,
  },
];

const coreFlow = [
  "Admin creates the workspace",
  "Knowledge is uploaded or connected",
  "Users accept invites and install Radar",
  "Ended calls feed review and analytics",
];

export async function OverviewPage({ onboardingAudience }: OverviewPageProps = {}) {
  const context = await getAdminContext();
  const [overview, sessions] = await Promise.all([
    getAdminCollection("overview", context),
    getAdminCollection("sessions", context),
  ]);
  const overviewRecord = firstRecord(overview);
  const recentCalls = sessions.state === "ready" ? sessions.data.slice(0, 4) : [];
  const role = context.state === "ready" ? context.role : null;
  const forceUserOnboarding = onboardingAudience === "user";
  const showAdminOnboarding =
    !forceUserOnboarding && Boolean(role && ["owner", "admin", "knowledge_manager"].includes(role));
  const showUserOnboarding = forceUserOnboarding || role === "user";
  const readiness = {
    sources: numberValue(overviewRecord?.sources),
    users: numberValue(overviewRecord?.users),
    calls: numberValue(overviewRecord?.sessions),
  };
  const nextStep = getNextStep(readiness, context.state);

  return (
    <>
      <AdminPageHeader
        title="Overview"
        description="The core Radar flow: admin sets up the workspace, users run the extension, ended calls become review and analytics."
      >
        <RadarOnboardingTour audience="admin" autoOpen={showAdminOnboarding} />
        <RadarOnboardingTour audience="user" autoOpen={showUserOnboarding} />
      </AdminPageHeader>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-4">
          <Card className="rounded-lg shadow-sm">
            <CardHeader className="gap-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-xl">Next step</CardTitle>
                  <CardDescription className="mt-2 leading-6">
                    Keep setup focused on the shortest path to a real call.
                  </CardDescription>
                </div>
                <Badge variant="secondary">{nextStep.stage}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Link
                href={nextStep.href}
                className="group flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 transition hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-white">
                    <nextStep.icon />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-zinc-950">{nextStep.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">{nextStep.body}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-950">
                  {nextStep.action}
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-sm">
            <CardHeader className="gap-2">
              <CardTitle className="text-xl">Recent calls</CardTitle>
              <CardDescription className="leading-6">
                Calls appear here after a user starts Radar in Chrome and ends the session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentCalls records={recentCalls} sessionsState={sessions.state} />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="rounded-lg shadow-sm">
            <CardHeader className="gap-2">
              <CardTitle className="text-xl">Core flow</CardTitle>
              <CardDescription className="leading-6">
                Everything else should support this path.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {coreFlow.map((step, index) => (
                <div key={step} className="flex items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-zinc-700">{step}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function RecentCalls({
  records,
  sessionsState,
}: {
  records: AdminRecord[];
  sessionsState: string;
}) {
  if (sessionsState !== "ready") {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
        Connect the workspace database to load ended Radar calls.
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
        No calls captured yet. Sign in to Radar in Chrome, start the extension during a call, then
        end the session.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      {records.map((record) => {
        const id = displayValue(record.id);
        const title = displayValue(record.title) || (id ? `Call ${id.slice(0, 8)}` : "Radar call");
        const status = displayValue(record.status);

        return (
          <Link
            key={id || title}
            href={id ? `/app/sessions/${encodeURIComponent(id)}` : "/app/sessions"}
            className="flex items-center justify-between gap-4 border-b border-zinc-200 p-4 last:border-b-0 hover:bg-zinc-50"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-zinc-950">{title}</div>
              <div className="mt-1 text-xs text-zinc-500">{status ? `Status: ${status}` : "Review call"}</div>
            </div>
            <span className="inline-flex h-8 items-center justify-center rounded-md border border-zinc-200 px-3 text-xs font-semibold text-zinc-700">
              Review
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function getNextStep(
  readiness: { sources: number; users: number; calls: number },
  contextState: string,
) {
  if (contextState !== "ready") {
    return {
      stage: "Workspace",
      title: "Connect workspace data",
      body: "Radar needs the workspace database before users, sources, calls, and analytics can load.",
      href: "/app/settings",
      action: "Review settings",
      icon: BarChart3,
    };
  }

  if (readiness.sources === 0) {
    return setupSteps[0];
  }

  if (readiness.users <= 1) {
    return setupSteps[2];
  }

  if (readiness.calls === 0) {
    return setupSteps[3];
  }

  return {
    stage: "Review",
    title: "Review call analytics",
    body: "Use ended calls to inspect citation coverage, confirmation moments, and escalations.",
    href: "/app/analytics",
    action: "Open analytics",
    icon: BarChart3,
  };
}

function firstRecord(result: Awaited<ReturnType<typeof getAdminCollection>>) {
  return result.state === "ready" ? result.data[0] : undefined;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function displayValue(value: unknown) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

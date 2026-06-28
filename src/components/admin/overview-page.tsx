import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Download,
  FileText,
  PlugZap,
  ShieldCheck,
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

export async function OverviewPage({ onboardingAudience }: OverviewPageProps = {}) {
  const context = await getAdminContext();
  const [overview, sessions, analytics] = await Promise.all([
    getAdminCollection("overview", context),
    getAdminCollection("sessions", context),
    getAdminCollection("analytics", context),
  ]);
  const overviewRecord = firstRecord(overview);
  const analyticsRecord = firstRecord(analytics);
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
        title="Dashboard"
        description="Workspace health, call outcomes, and the next action needed to get Radar into real customer conversations."
      >
        <RadarOnboardingTour audience="admin" autoOpen={showAdminOnboarding} />
        <RadarOnboardingTour audience="user" autoOpen={showUserOnboarding} />
      </AdminPageHeader>

      <div className="grid gap-4">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-white">
                <nextStep.icon />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-zinc-950">{nextStep.title}</h2>
                  <Badge variant="secondary">{nextStep.stage}</Badge>
                </div>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-600">{nextStep.body}</p>
              </div>
            </div>
            <Link
              href={nextStep.href}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 lg:w-auto"
            >
              {nextStep.action}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]">
          <AnalyticsOverview record={analyticsRecord} state={analytics.state} />
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
      </div>
    </>
  );
}

function AnalyticsOverview({
  record,
  state,
}: {
  record: AdminRecord | undefined;
  state: string;
}) {
  if (state !== "ready" || !record) {
    return (
      <Card className="rounded-lg shadow-sm">
        <CardHeader className="gap-2">
          <CardTitle className="text-xl">Call analytics</CardTitle>
          <CardDescription className="leading-6">
            Connect workspace data and end the first Radar call to populate analytics.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const answerProofCards = numberValue(record.answerCards) + numberValue(record.proofCards);
  const citedAnswerCards = numberValue(record.citedAnswerCards);
  const citationCoverage =
    answerProofCards > 0 ? `${Math.round((citedAnswerCards / answerProofCards) * 100)}%` : "No cards";
  const confirmationSignals =
    numberValue(record.needsConfirmationCards) + numberValue(record.escalationCards);
  const unfinishedCalls = numberValue(record.activeSessions) + numberValue(record.pausedSessions);

  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-xl">Call analytics</CardTitle>
            <CardDescription className="mt-2 leading-6">
              Evidence from ended calls, cited guidance, and confirmation or escalation moments.
            </CardDescription>
          </div>
          <Link
            href="/app/analytics"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-950"
          >
            Open detail
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border border-zinc-200">
          <div className="grid lg:grid-cols-2">
            <AnalyticsSignal
              label="Ended calls"
              value={numberValue(record.endedSessions)}
              detail={
                unfinishedCalls > 0
                  ? `${unfinishedCalls} active or paused sessions still need ending`
                  : "Ready for review"
              }
              icon={BarChart3}
            />
            <AnalyticsSignal
              label="Citation coverage"
              value={citationCoverage}
              detail={`${citedAnswerCards} cited answer/proof cards`}
              icon={ShieldCheck}
            />
            <AnalyticsSignal
              label="Confirmation queue"
              value={confirmationSignals}
              detail={`${numberValue(record.needsConfirmationCards)} needs confirmation / ${numberValue(record.escalationCards)} escalations`}
              icon={AlertTriangle}
            />
            <AnalyticsSignal
              label="Workspace knowledge"
              value={numberValue(record.approvedSources)}
              detail={`${numberValue(record.retrievalEvents)} retrieval events logged`}
              icon={FileText}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsSignal({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex min-h-32 flex-col gap-4 border-b border-zinc-200 p-4 last:border-b-0 lg:flex-row lg:[&:nth-child(odd)]:border-r lg:[&:nth-last-child(-n+2)]:border-b-0">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-white">
        <Icon />
      </div>
      <div>
        <div className="text-sm font-medium text-zinc-600">{label}</div>
        <div className="mt-2 text-2xl font-semibold text-zinc-950">{value}</div>
        <p className="mt-2 text-sm leading-5 text-zinc-600">{detail}</p>
      </div>
    </div>
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

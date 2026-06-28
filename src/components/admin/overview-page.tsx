import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Download,
  MonitorCheck,
  PlugZap,
  UploadCloud,
  Users,
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
  const [overview, sessions, analytics, sources] = await Promise.all([
    getAdminCollection("overview", context),
    getAdminCollection("sessions", context),
    getAdminCollection("analytics", context),
    getAdminCollection("sources", context),
  ]);
  const overviewRecord = firstRecord(overview);
  const analyticsRecord = firstRecord(analytics);
  const recentCalls = sessions.state === "ready" ? sessions.data.slice(0, 4) : [];
  const knowledgeSources = sources.state === "ready" ? sources.data.slice(0, 4) : [];
  const role = context.state === "ready" ? context.role : null;
  const forceUserOnboarding = onboardingAudience === "user";
  const adminRoles = ["owner", "admin", "knowledge_manager"];
  const isAdminRole = Boolean(role && adminRoles.includes(role));
  const showAdminOnboarding = !forceUserOnboarding && isAdminRole;
  const showUserOnboarding = forceUserOnboarding || role === "user";
  const showExtensionSetup =
    context.state === "ready" &&
    (forceUserOnboarding || context.onboardingState === "extension_setup" || role === "user");
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
        {isAdminRole ? <RadarOnboardingTour audience="admin" autoOpen={showAdminOnboarding} /> : null}
        {!isAdminRole || forceUserOnboarding ? (
          <RadarOnboardingTour audience="user" autoOpen={showUserOnboarding} />
        ) : null}
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

        {showExtensionSetup ? <UserExtensionSetupPanel /> : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]">
          <Card className="rounded-lg shadow-sm">
            <CardHeader className="gap-2">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle className="text-xl">Workspace knowledge</CardTitle>
                  <CardDescription className="mt-2 leading-6">
                    Approved sources Radar can retrieve and cite during customer conversations.
                  </CardDescription>
                </div>
                <Link
                  href="/app/sources"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-950"
                >
                  View all
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <KnowledgeSummary records={knowledgeSources} sourcesState={sources.state} />
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-sm">
            <CardHeader className="gap-2">
              <CardTitle className="text-xl">Recent calls</CardTitle>
              <CardDescription className="leading-6">
                Sessions from the Chrome extension, including active, paused, and ended calls.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentCalls
                records={recentCalls}
                sessionsState={sessions.state}
                analyticsRecord={analyticsRecord}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function UserExtensionSetupPanel() {
  return (
    <section
      id="install-radar"
      className="grid gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_18rem]"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white">
          <MonitorCheck />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-emerald-950">Install Radar for your first call</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-emerald-900/80">
            Download the Chrome extension, load it unpacked, then start Radar only after call consent
            is clear. End the session when the call finishes so it appears in Calls and analytics.
          </p>
          <ol className="mt-4 grid gap-2 text-sm leading-6 text-emerald-950">
            <li>1. Download and unzip the Radar extension package.</li>
            <li>2. Open Chrome Extensions, enable Developer mode, then choose Load unpacked.</li>
            <li>3. Select the unzipped Radar folder, pin Radar, and keep the API set to this app.</li>
          </ol>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-2">
        <Link
          href="/api/extension/package"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900"
        >
          <Download className="size-4" />
          Download extension
        </Link>
        <Link
          href="/app/sessions"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-100"
        >
          Open calls
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

function KnowledgeSummary({
  records,
  sourcesState,
}: {
  records: AdminRecord[];
  sourcesState: string;
}) {
  if (sourcesState !== "ready") {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
        Connect the workspace database before Radar can load approved knowledge sources.
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-white">
            <BookOpenCheck />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">Add the first approved source</h3>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              Upload a source or request a connector so Radar has evidence to cite before it answers.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/app/uploads"
                className="inline-flex h-9 items-center justify-center rounded-md bg-zinc-950 px-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Upload source
              </Link>
              <Link
                href="/app/connectors"
                className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 px-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
              >
                Connect tool
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      {records.map((record) => {
        const id = displayValue(record.id);
        const title = displayValue(record.title) || "Untitled source";
        const status = displayValue(record.status);
        const sourceType = displayValue(record.sourceType);
        const chunkCount = numberValue(record.chunkCount);

        return (
          <Link
            key={id || title}
            href={id ? `/app/sources/${encodeURIComponent(id)}` : "/app/sources"}
            className="flex items-center justify-between gap-4 border-b border-zinc-200 p-4 last:border-b-0 hover:bg-zinc-50"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-zinc-950">{title}</div>
              <div className="mt-1 text-xs text-zinc-500">
                {formatSourceType(sourceType)}
                {status ? ` · ${formatStatus(status)}` : ""}
                {chunkCount > 0 ? ` · ${chunkCount} chunks` : ""}
              </div>
            </div>
            <span className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-zinc-200 px-3 text-xs font-semibold text-zinc-700">
              Open
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function RecentCalls({
  records,
  sessionsState,
  analyticsRecord,
}: {
  records: AdminRecord[];
  sessionsState: string;
  analyticsRecord?: AdminRecord;
}) {
  if (sessionsState !== "ready") {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
        Connect the workspace database to load Radar sessions from the Chrome extension.
      </div>
    );
  }

  const analyticsText = getAnalyticsText(analyticsRecord);

  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
        No sessions captured yet. Sign in to Radar in Chrome, start the extension during a call,
        then end the session so the review is ready.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {analyticsText ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-600">
          {analyticsText}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-zinc-200">
        {records.map((record) => {
          const id = displayValue(record.id);
          const title = displayValue(record.title) || (id ? `Call ${id.slice(0, 8)}` : "Radar call");
          const status = displayValue(record.status);
          const statusLabel = formatStatus(status);
          const isEnded = status === "ended";

          return (
            <Link
              key={id || title}
              href={id ? `/app/sessions/${encodeURIComponent(id)}` : "/app/sessions"}
              className="flex items-center justify-between gap-4 border-b border-zinc-200 p-4 last:border-b-0 hover:bg-zinc-50"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-zinc-950">{title}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  {statusLabel ? `Status: ${statusLabel}` : "Review call"}
                </div>
              </div>
              <span className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-zinc-200 px-3 text-xs font-semibold text-zinc-700">
                {isEnded ? "Review" : "Open"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function getAnalyticsText(record: AdminRecord | undefined) {
  if (!record) {
    return null;
  }

  const endedSessions = numberValue(record.endedSessions);
  const unfinishedSessions = numberValue(record.activeSessions) + numberValue(record.pausedSessions);
  const answerProofCards = numberValue(record.answerCards) + numberValue(record.proofCards);
  const citedAnswerCards = numberValue(record.citedAnswerCards);

  if (endedSessions === 0 && unfinishedSessions === 0) {
    return "Analytics starts after the first Radar session is created.";
  }

  const parts = [`${endedSessions} ended ${endedSessions === 1 ? "call" : "calls"}`];

  if (unfinishedSessions > 0) {
    parts.push(`${unfinishedSessions} active or paused`);
  }

  if (answerProofCards > 0) {
    parts.push(`${Math.round((citedAnswerCards / answerProofCards) * 100)}% cited answer/proof coverage`);
  }

  return parts.join(" · ");
}

function formatSourceType(value: string) {
  const labels: Record<string, string> = {
    document: "Document",
    playbook: "Playbook",
    policy: "Policy",
    faq: "FAQ",
    note: "Note",
  };

  return labels[value] ?? "Source";
}

function formatStatus(value: string) {
  const labels: Record<string, string> = {
    active: "Active",
    paused: "Paused",
    ended: "Ended",
    approved: "Approved",
    pending: "Pending",
    rejected: "Rejected",
    failed: "Failed",
  };

  return labels[value] ?? value;
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

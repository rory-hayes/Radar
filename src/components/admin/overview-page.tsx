import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Circle,
  Download,
  FileSearch,
  MonitorCheck,
  UploadCloud,
  Users,
  type LucideIcon,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-surfaces";
import { RadarOnboardingTour } from "@/components/admin/onboarding-tour";
import { Badge } from "@/components/ui/badge";
import {
  getAdminCollection,
  getAdminContext,
  type AdminDataResult,
  type AdminRecord,
} from "@/lib/admin-data";

type OverviewPageProps = {
  onboardingAudience?: "admin" | "user";
};

type JourneyItem = {
  title: string;
  body: string;
  href: string;
  action: string;
  icon: LucideIcon;
  state: "done" | "next" | "waiting";
};

const setupSteps = [
  {
    stage: "Knowledge",
    title: "Add workspace knowledge",
    body: "Upload or connect the first approved source so Radar has evidence to cite.",
    href: "/app/sources#add-source",
    action: "Add source",
    icon: UploadCloud,
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
  const journey = getWorkspaceJourney(readiness, context.state);

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="A simple path from approved knowledge to invited users, installed extension, and reviewed calls."
      >
        {isAdminRole ? <RadarOnboardingTour audience="admin" autoOpen={showAdminOnboarding} /> : null}
        {!isAdminRole || forceUserOnboarding ? (
          <RadarOnboardingTour audience="user" autoOpen={showUserOnboarding} />
        ) : null}
      </AdminPageHeader>

      <div className="grid gap-4">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">Workspace path</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Keep setup focused on the few steps that make Radar useful in a real call.
              </p>
            </div>
            <Badge variant="outline">{context.state === "ready" ? "Workspace connected" : "Setup needed"}</Badge>
          </div>
          <div className="mt-5 divide-y divide-zinc-200 rounded-lg border border-zinc-200">
            {journey.map((item) => (
              <JourneyRow key={item.title} item={item} />
            ))}
          </div>
        </section>

        {showExtensionSetup ? <UserExtensionSetupPanel /> : null}

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">Call outcomes</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Ended extension sessions appear here with review links and roll into analytics.
              </p>
            </div>
            <Link href="/app/sessions" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-950">
              Open calls
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-5">
            <RecentCalls
              records={recentCalls}
              sessionsState={sessions.state}
              sessionsMessage={sessions.state !== "ready" ? sessions.message : undefined}
              analyticsRecord={analyticsRecord}
            />
          </div>
        </section>
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
            is clear. End the session when the call finishes so it appears in Calls.
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

function JourneyRow({ item }: { item: JourneyItem }) {
  const Icon = item.icon;
  const statusLabel = {
    done: "Done",
    next: "Next",
    waiting: "Waiting",
  }[item.state];
  const StatusIcon = item.state === "done" ? CheckCircle2 : Circle;

  return (
    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <div
          className={
            item.state === "waiting"
              ? "flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500"
              : "flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-white"
          }
        >
          <Icon className="size-4" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-950">{item.title}</h3>
            <Badge variant={item.state === "next" ? "default" : "outline"} className="gap-1">
              <StatusIcon className="size-3" />
              {statusLabel}
            </Badge>
          </div>
          <p className="mt-1 text-sm leading-6 text-zinc-600">{item.body}</p>
        </div>
      </div>
      <Link
        href={item.href}
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-zinc-200 px-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
      >
        {item.action}
      </Link>
    </div>
  );
}

function RecentCalls({
  records,
  sessionsState,
  sessionsMessage,
  analyticsRecord,
}: {
  records: AdminRecord[];
  sessionsState: AdminDataResult<AdminRecord[]>["state"];
  sessionsMessage?: string;
  analyticsRecord?: AdminRecord;
}) {
  if (sessionsState === "empty") {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
        No sessions captured yet. Sign in to Radar in Chrome, start the extension during a call,
        then end the session so the review is ready.
      </div>
    );
  }

  if (sessionsState !== "ready") {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
        {sessionsMessage || "Connect the workspace database to load Radar sessions from the Chrome extension."}
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

  return parts.join(" / ");
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

function getWorkspaceJourney(
  readiness: { sources: number; users: number; calls: number },
  contextState: string,
): JourneyItem[] {
  if (contextState !== "ready") {
    return [
      {
        title: "Connect workspace data",
        body: "Radar needs workspace data before sources, users, calls, and invite state can load.",
        href: "/app/settings",
        action: "Review settings",
        icon: BarChart3,
        state: "next",
      },
    ];
  }

  return [
    {
      title: "Add approved knowledge",
      body: `${readiness.sources} approved ${readiness.sources === 1 ? "source" : "sources"} available for citations.`,
      href: "/app/sources#add-source",
      action: readiness.sources > 0 ? "Manage sources" : "Add source",
      icon: FileSearch,
      state: readiness.sources > 0 ? "done" : "next",
    },
    {
      title: "Invite the team",
      body: `${readiness.users} workspace ${readiness.users === 1 ? "member" : "members"} can access Radar.`,
      href: "/app/users",
      action: "Invite users",
      icon: Users,
      state: readiness.users > 1 ? "done" : readiness.sources > 0 ? "next" : "waiting",
    },
    {
      title: "Install Radar Live Assist",
      body: "Users install the Chrome extension during onboarding before joining customer calls.",
      href: "/app?onboarding=user",
      action: "User setup",
      icon: Download,
      state: readiness.calls > 0 ? "done" : readiness.users > 1 ? "next" : "waiting",
    },
    {
      title: "Review ended calls",
      body: `${readiness.calls} ended ${readiness.calls === 1 ? "call" : "calls"} are available for review and analytics.`,
      href: "/app/sessions",
      action: "Open calls",
      icon: BarChart3,
      state: readiness.calls > 0 ? "next" : "waiting",
    },
  ];
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
    return setupSteps[1];
  }

  if (readiness.calls === 0) {
    return setupSteps[2];
  }

  return {
    stage: "Review",
    title: "Review recent calls",
    body: "Use captured calls to inspect citation coverage, confirmation moments, and escalations.",
    href: "/app/sessions",
    action: "Open calls",
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

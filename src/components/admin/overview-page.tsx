import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  Download,
  PlugZap,
  Radio,
  UploadCloud,
  Users,
  type LucideIcon,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-surfaces";
import { RadarOnboardingTour } from "@/components/admin/onboarding-tour";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    title: "Add approved knowledge",
    body: "Upload a policy, FAQ, or playbook Radar can cite in live calls.",
    href: "/app/uploads",
    action: "Upload",
    icon: UploadCloud,
  },
  {
    title: "Connect source systems",
    body: "Plan Google Drive, Confluence, Notion, CRM, and support data syncs.",
    href: "/app/connectors",
    action: "Connect",
    icon: PlugZap,
  },
  {
    title: "Invite users",
    body: "Bring teammates into the same workspace and personal setup flow.",
    href: "/app/users",
    action: "Invite",
    icon: Users,
  },
  {
    title: "Install the extension",
    body: "Use Radar from Chrome during customer conversations, then review calls here.",
    href: "/app/sessions",
    action: "Review calls",
    icon: Download,
  },
];

export async function OverviewPage({ onboardingAudience }: OverviewPageProps = {}) {
  const context = await getAdminContext();
  const [overview, analytics, sessions] = await Promise.all([
    getAdminCollection("overview", context),
    getAdminCollection("analytics", context),
    getAdminCollection("sessions", context),
  ]);
  const overviewRecord = firstRecord(overview);
  const analyticsRecord = firstRecord(analytics);
  const recentCalls = sessions.state === "ready" ? sessions.data.slice(0, 4) : [];
  const role = context.state === "ready" ? context.role : null;
  const forceUserOnboarding = onboardingAudience === "user";
  const showAdminOnboarding =
    !forceUserOnboarding && Boolean(role && ["owner", "admin", "knowledge_manager"].includes(role));
  const showUserOnboarding = forceUserOnboarding || role === "user";

  return (
    <>
      <AdminPageHeader
        title="Radar Dashboard"
        description="A simple workspace view for knowledge readiness, user setup, extension capture, and call review."
      >
        <RadarOnboardingTour audience="admin" autoOpen={showAdminOnboarding} />
        <RadarOnboardingTour audience="user" autoOpen={showUserOnboarding} />
      </AdminPageHeader>

      <div className="flex flex-col gap-4">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Database}
            label="Approved sources"
            value={numberValue(overviewRecord?.sources)}
            href="/app/sources"
          />
          <MetricCard
            icon={Users}
            label="Workspace users"
            value={numberValue(overviewRecord?.users)}
            href="/app/users"
          />
          <MetricCard
            icon={Radio}
            label="Calls captured"
            value={numberValue(overviewRecord?.sessions)}
            href="/app/sessions"
          />
          <MetricCard
            icon={BarChart3}
            label="Guidance cards"
            value={numberValue(analyticsRecord?.guidanceCards)}
            href="/app/analytics"
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
          <Card className="rounded-lg shadow-sm">
            <CardHeader className="gap-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Core setup</CardTitle>
                  <CardDescription className="mt-2 leading-6">
                    Admins prepare the shared workspace, then users install Radar and review calls.
                  </CardDescription>
                </div>
                <Badge variant="outline">Workspace flow</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {setupSteps.map((step, index) => (
                  <SetupStep key={step.title} step={step} index={index} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-sm">
            <CardHeader className="gap-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Recent calls</CardTitle>
                  <CardDescription className="mt-2 leading-6">
                    Calls started from the Chrome extension appear here after they are ended.
                  </CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/app/sessions">View all</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <RecentCalls records={recentCalls} sessionsState={sessions.state} />
            </CardContent>
          </Card>
        </section>

        <Card className="rounded-lg shadow-sm">
          <CardHeader className="gap-2">
            <CardTitle className="text-xl">What happens next</CardTitle>
            <CardDescription className="leading-6">
              Radar stays quiet until a user starts the Chrome extension during a customer
              conversation. After the call ends, transcripts, cards, and citation coverage roll
              into Calls and Analytics.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <FlowPoint title="1. Admin adds knowledge" body="Upload or connect approved sources." />
            <FlowPoint title="2. User runs Radar" body="The extension starts capture only after consent." />
            <FlowPoint title="3. Team reviews outcomes" body="Ended calls feed review and analytics." />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-950 text-white">
          <Icon />
        </div>
        <ArrowRight className="size-4 text-zinc-400" />
      </div>
      <div className="mt-5 text-3xl font-semibold tracking-normal text-zinc-950">
        {value.toLocaleString()}
      </div>
      <div className="mt-1 text-sm font-medium text-zinc-600">{label}</div>
    </Link>
  );
}

function SetupStep({
  step,
  index,
}: {
  step: (typeof setupSteps)[number];
  index: number;
}) {
  const Icon = step.icon;

  return (
    <Link
      href={step.href}
      className="group flex items-center gap-4 rounded-lg border border-zinc-200 p-4 transition hover:bg-zinc-50"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800">
        <Icon />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500">{index + 1}</span>
          <h2 className="text-sm font-semibold text-zinc-950">{step.title}</h2>
        </div>
        <p className="mt-1 text-sm leading-5 text-zinc-600">{step.body}</p>
      </div>
      <span className="hidden text-sm font-medium text-zinc-950 group-hover:text-primary sm:inline">
        {step.action}
      </span>
    </Link>
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
        No call records are available yet. Start and end a Radar extension session to create one.
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
        No calls captured yet. Once a user ends a Radar session, it will appear here.
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
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          </Link>
        );
      })}
    </div>
  );
}

function FlowPoint({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
      <p className="mt-1 text-sm leading-5 text-zinc-600">{body}</p>
    </div>
  );
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

import Link from "next/link";
import {
  Activity,
  BadgeCheck,
  BookOpenCheck,
  Database,
  FileWarning,
  Radio,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { AdminContextPanel, AdminPageHeader, adminSurfaces } from "@/components/admin/admin-surfaces";
import { RadarOnboardingTour } from "@/components/admin/onboarding-tour";
import { RadarCallStack } from "@/components/radar/call-stack";
import { Button } from "@/components/ui/button";
import { getAdminCollection, getAdminContext } from "@/lib/admin-data";
import type { AdminContext } from "@/lib/admin-data";

const dashboardLinks = [
  {
    href: "/app/users",
    label: "Users",
    description: "Invite users, assign workspace roles, and track personal onboarding state.",
    icon: Users,
  },
  {
    href: "/app/sources",
    label: "Sources",
    description: "Approved source inventory, owners, freshness, and citation eligibility.",
    icon: Database,
  },
  {
    href: "/app/playbooks",
    label: "Playbooks",
    description: "Guidance patterns that can be shown only when cited.",
    icon: BookOpenCheck,
  },
  {
    href: "/app/approvals",
    label: "Approvals",
    description: "Human review gates before knowledge becomes available in calls.",
    icon: BadgeCheck,
  },
  {
    href: "/app/knowledge-gaps",
    label: "Knowledge Gaps",
    description: "Unsupported questions and escalation patterns to resolve.",
    icon: FileWarning,
  },
];

const workflowLinks = [
  { href: "/app/sessions", label: adminSurfaces.sessions.title },
  { href: "/app/testing", label: adminSurfaces["testing-replay"].title },
  { href: "/app/analytics", label: adminSurfaces.analytics.title },
  { href: "/app/audit-log", label: adminSurfaces["audit-log"].title },
];

export async function OverviewPage() {
  const context = await getAdminContext();
  const overview = await getAdminCollection("overview", context);

  return (
    <>
      <AdminPageHeader
        title="Radar Dashboard"
        description="Default command center for live-call readiness, approved knowledge, review queues, and escalation follow-through."
      >
        <RadarOnboardingTour audience="admin" />
        <RadarOnboardingTour audience="user" autoOpen={false} />
        <Button asChild variant="outline">
          <Link href="/app/settings">
            <Settings data-icon="inline-start" />
            Settings
          </Link>
        </Button>
      </AdminPageHeader>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-500">Today</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-normal text-zinc-950">
                    Ready when the evidence is ready
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                    Radar stays quiet until admin configuration, source approval, call consent,
                    and citation policy are all in place.
                  </p>
                </div>
                <StatusPill state={overview.state === "ready" ? "ready" : "setup"} />
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <ReadinessCard
                  icon={Radio}
                  title="Live calls"
                  value={overview.state === "ready" ? "Connected" : "Setup"}
                  description="Realtime transcription and session intake."
                  tone={overview.state === "ready" ? "ready" : "setup"}
                />
                <ReadinessCard
                  icon={ShieldCheck}
                  title="Answer policy"
                  value="Enforced"
                  description="Answers require citations; weak claims escalate."
                  tone="ready"
                />
                <ReadinessCard
                  icon={Database}
                  title="Admin data"
                  value={context.state === "ready" ? "Connected" : "Setup"}
                  description="Sources, playbooks, audit, and analytics API state."
                  tone={context.state === "ready" ? "ready" : "setup"}
                />
              </div>

              <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
                {overview.state === "ready"
                  ? "Overview data is loaded from the configured admin API."
                  : overview.message}
              </div>
            </div>

            <RadarCallStack className="min-h-[30rem]" />
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dashboardLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-white">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h2 className="mt-5 text-base font-semibold text-zinc-950">{item.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{item.description}</p>
                  <p className="mt-5 text-sm font-medium text-zinc-950 group-hover:text-primary">
                    Open workflow
                  </p>
                </Link>
              );
            })}
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-950">Call readiness path</h2>
              <div className="mt-5 space-y-4">
                <ReadinessStep title="Consent captured" body="The extension starts only after the rep confirms workspace policy." state="ready" />
                <ReadinessStep title="Realtime credential minted" body="Browser receives a short-lived client secret, never the server key." state="setup" />
                <ReadinessStep title="Citation policy applied" body="Cards stay as ask, confirm, or escalate until approved evidence exists." state="ready" />
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-zinc-950">Primary workflows</h2>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    Default dashboard shortcuts for building out Radar operations.
                  </p>
                </div>
                <Activity className="h-5 w-5 text-zinc-400" />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {workflowLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <span>{item.label}</span>
                    <span className="text-zinc-400">Open</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <AdminContextPanel context={context} />
          <DashboardPolicyPanel context={context} />
        </div>
      </div>
    </>
  );
}

function StatusPill({ state }: { state: "ready" | "setup" }) {
  return (
    <span
      className={
        state === "ready"
          ? "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700"
          : "inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700"
      }
    >
      {state === "ready" ? "Connected" : "Setup required"}
    </span>
  );
}

function ReadinessCard({
  icon: Icon,
  title,
  value,
  description,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  description: string;
  tone: "ready" | "setup";
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-700 shadow-sm">
          <Icon className="h-4 w-4" />
        </div>
        <span
          className={
            tone === "ready"
              ? "text-xs font-medium text-emerald-700"
              : "text-xs font-medium text-amber-700"
          }
        >
          {value}
        </span>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-zinc-950">{title}</h3>
      <p className="mt-1 text-sm leading-5 text-zinc-600">{description}</p>
    </div>
  );
}

function ReadinessStep({
  title,
  body,
  state,
}: {
  title: string;
  body: string;
  state: "ready" | "setup";
}) {
  return (
    <div className="flex gap-3">
      <span
        className={
          state === "ready"
            ? "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
            : "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600"
        }
      >
        <BadgeCheck className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-zinc-600">{body}</p>
      </div>
    </div>
  );
}

function DashboardPolicyPanel({ context }: { context: AdminContext }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-950">Production rules</h2>
      <div className="mt-4 space-y-3">
        <PolicyRow label="No browser OpenAI key" state="Enforced" />
        <PolicyRow label="Answer cards need citations" state="Enforced" />
        <PolicyRow label="Unsupported claims escalate" state="Enforced" />
        <PolicyRow
          label="Tenant admin API"
          state={context.state === "ready" ? "Connected" : "Setup required"}
        />
      </div>
    </section>
  );
}

function PolicyRow({ label, state }: { label: string; state: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-3 py-2 text-sm">
      <span className="text-zinc-600">{label}</span>
      <span className="font-medium text-zinc-950">{state}</span>
    </div>
  );
}

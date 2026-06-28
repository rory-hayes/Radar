import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  FileText,
  MessageSquareText,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-surfaces";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminCollection, getAdminContext, type AdminRecord } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const context = await getAdminContext();
  const result = await getAdminCollection("analytics", context);
  const analytics = result.state === "ready" ? result.data[0] : undefined;
  const citedAnswerCards = numberValue(analytics?.citedAnswerCards);
  const approvedSources = numberValue(analytics?.approvedSources);

  return (
    <>
      <AdminPageHeader
        title="Analytics"
        description="Track whether Radar is producing reviewable calls, cited guidance, and confirmation/escalation signals."
      >
        <Badge variant={result.state === "ready" ? "secondary" : "outline"}>
          {result.state === "ready" ? "Live workspace data" : "Waiting for data"}
        </Badge>
      </AdminPageHeader>

      {result.state !== "ready" ? (
        <Card className="rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Analytics unavailable</CardTitle>
            <CardDescription className="leading-6">
              {result.message}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : !analytics ? (
        <Card className="rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">No analytics yet</CardTitle>
            <CardDescription className="leading-6">
              Start and end a Radar session to populate analytics.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Calls captured"
              value={numberValue(analytics.sessions)}
              description={`${numberValue(analytics.endedSessions)} ended, ${numberValue(analytics.activeSessions)} active`}
              icon={BarChart3}
            />
            <MetricCard
              title="Transcript segments"
              value={numberValue(analytics.transcriptSegments)}
              description="Final transcript units stored from Radar sessions"
              icon={MessageSquareText}
            />
            <MetricCard
              title="Guidance cards"
              value={numberValue(analytics.guidanceCards)}
              description={`${formatCount(citedAnswerCards, "answer/proof card")} ${citedAnswerCards === 1 ? "includes" : "include"} citations`}
              icon={ShieldCheck}
            />
            <MetricCard
              title="Knowledge chunks"
              value={numberValue(analytics.knowledgeChunks)}
              description={`${formatCount(approvedSources, "approved source")} available`}
              icon={FileText}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <Card className="rounded-lg shadow-sm">
              <CardHeader className="gap-2">
                <CardTitle className="text-xl">Guidance quality</CardTitle>
                <CardDescription className="leading-6">
                  Radar should cite supported answers and route unsupported claims to confirmation or escalation.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <BreakdownRow label="Answers" value={numberValue(analytics.answerCards)} />
                <BreakdownRow label="Proof cards" value={numberValue(analytics.proofCards)} />
                <BreakdownRow label="Needs confirmation" value={numberValue(analytics.needsConfirmationCards)} />
                <BreakdownRow label="Escalations" value={numberValue(analytics.escalationCards)} />
              </CardContent>
            </Card>

            <Card className="rounded-lg shadow-sm">
              <CardHeader className="gap-2">
                <CardTitle className="text-xl">Next review</CardTitle>
                <CardDescription className="leading-6">
                  Use calls to inspect evidence coverage before expanding connector syncs.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Link
                  href="/app/sessions"
                  className="group flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-50"
                >
                  Review calls
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/app/connectors"
                  className="group flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-50"
                >
                  Request connector setup
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </Link>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader className="gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-950 text-white">
          <Icon />
        </div>
        <div>
          <CardDescription>{title}</CardDescription>
          <CardTitle className="mt-2 text-3xl">{value}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-zinc-600">{description}</p>
      </CardContent>
    </Card>
  );
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <div className="text-sm font-medium text-zinc-600">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-zinc-950">{value}</div>
    </div>
  );
}

function numberValue(value: AdminRecord[string]) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatCount(value: number, noun: string) {
  return `${value} ${noun}${value === 1 ? "" : "s"}`;
}

import Link from "next/link";
import {
  BadgeCheck,
  FileWarning,
  MessageSquareWarning,
  Radio,
  type LucideIcon,
} from "lucide-react";

import {
  AdminContextPanel,
  AdminPageHeader,
  adminSurfaces,
} from "@/components/admin/admin-surfaces";
import { RadarCallStack } from "@/components/radar/call-stack";
import { Button } from "@/components/ui/button";
import { getAdminCollection, getAdminContext } from "@/lib/admin-data";
import type { AdminDataResult, AdminRecord } from "@/lib/admin-data";

export async function CallsPage() {
  const context = await getAdminContext();
  const result = await getAdminCollection("sessions", context);

  return (
    <>
      <AdminPageHeader
        title="Calls"
        description="Review live-call capture, transcript segments, cited cards, needs-confirmation moments, and escalations."
      >
        <Button asChild variant="outline">
          <Link href="/app/testing">Open Testing & Replay</Link>
        </Button>
      </AdminPageHeader>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <section className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <RadarCallStack className="min-h-[30rem]" />

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-500">Call console</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-normal text-zinc-950">
                    One live stack, then review
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    The live overlay stays small during the call. Afterward, this
                    view becomes the reviewed timeline for transcripts, guidance,
                    confirmations, and citations.
                  </p>
                </div>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                  Setup
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <CallStateCard
                  icon={Radio}
                  title="Live transcript"
                  body="Microphone Realtime transcription streams through the extension offscreen worker."
                />
                <CallStateCard
                  icon={BadgeCheck}
                  title="Cited cards"
                  body="Answer and proof cards are blocked until approved citations are present."
                />
                <CallStateCard
                  icon={MessageSquareWarning}
                  title="Needs confirmation"
                  body="Uncertain guidance remains visible as confirmation work, not confident answer text."
                />
                <CallStateCard
                  icon={FileWarning}
                  title="Escalations"
                  body="Unsupported claims are routed into review instead of being shown as final."
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-zinc-950">Call review queue</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Real call records appear here after a Radar extension session is ended.
              </p>
            </div>
            <CallQueue result={result} />
          </section>
        </div>

        <div className="space-y-4">
          <AdminContextPanel context={context} />
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-950">Call safeguards</h2>
            <div className="mt-4 space-y-3 text-sm">
              <Guardrail label="Consent before capture" />
              <Guardrail label="Short-lived Realtime client secret" />
              <Guardrail label="No raw audio storage by default" />
              <Guardrail label="Citations before answer cards" />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function CallStateCard({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-700 shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-zinc-950">{title}</h3>
      <p className="mt-1 text-sm leading-5 text-zinc-600">{body}</p>
    </div>
  );
}

function CallQueue({ result }: { result: AdminDataResult<AdminRecord[]> }) {
  if (result.state !== "ready") {
    const copy = {
      not_configured: result.message,
      unauthorized: result.message,
      error: result.message,
      empty: "No reviewed calls are available yet.",
    }[result.state];

    return (
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
        {copy}
      </div>
    );
  }

  if (result.data.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
        No reviewed calls are available yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      {result.data.map((record, index) => {
        const id = toDisplayValue(record.id ?? record.slug ?? record.key);
        const title = toDisplayValue(record.title ?? record.name ?? record.label ?? id);
        const status = toDisplayValue(record.status ?? record.state);

        return (
          <div
            key={id || index}
            className="flex flex-col gap-3 border-b border-zinc-200 p-4 last:border-b-0 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h3 className="text-sm font-semibold text-zinc-950">
                {title || id || "Untitled call"}
              </h3>
              {status ? <p className="mt-1 text-xs text-zinc-500">Status: {status}</p> : null}
            </div>
            {id ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/app/sessions/${encodeURIComponent(id)}`}>Review</Link>
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function Guardrail({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-3 py-2">
      <span className="text-zinc-600">{label}</span>
      <span className="font-medium text-zinc-950">Required</span>
    </div>
  );
}

function toDisplayValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

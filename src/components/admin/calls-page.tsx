import Link from "next/link";
import { BarChart3, Download, Radio, Square, type LucideIcon } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-surfaces";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminCollection, getAdminContext } from "@/lib/admin-data";
import type { AdminDataResult, AdminRecord } from "@/lib/admin-data";

const callFlow = [
  {
    icon: Download,
    title: "Install Radar",
    body: "The user signs in to the web app, installs the Chrome extension, and keeps the Radar API set to the deployed app.",
  },
  {
    icon: Radio,
    title: "Start during the call",
    body: "Radar creates a session only after the user starts capture from the extension.",
  },
  {
    icon: Square,
    title: "End the session",
    body: "Ended extension sessions are written to Calls and roll into analytics.",
  },
  {
    icon: BarChart3,
    title: "Review outcomes",
    body: "Transcript segments, cited cards, needs-confirmation states, and escalations are reviewed here.",
  },
];

export async function CallsPage() {
  const context = await getAdminContext();
  const result = await getAdminCollection("sessions", context);

  return (
    <>
      <AdminPageHeader
        title="Calls"
        description="Ended Radar extension sessions appear here for review."
      >
        <Button asChild variant="outline">
          <Link href="/app?onboarding=user">User setup</Link>
        </Button>
      </AdminPageHeader>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="rounded-lg shadow-sm">
          <CardHeader className="gap-2">
            <CardTitle className="text-xl">Call review queue</CardTitle>
            <CardDescription className="leading-6">
              Start and end a Radar extension session to create a call record.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CallQueue result={result} />
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-sm">
          <CardHeader className="gap-2">
            <CardTitle className="text-xl">How calls get here</CardTitle>
            <CardDescription className="leading-6">
              This is the only path V1 needs to make obvious.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {callFlow.map((item) => (
              <FlowRow key={item.title} item={item} />
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function FlowRow({
  item,
}: {
  item: {
    icon: LucideIcon;
    title: string;
    body: string;
  };
}) {
  const Icon = item.icon;

  return (
    <div className="flex gap-3 rounded-lg border border-zinc-200 p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-white">
        <Icon />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-zinc-950">{item.title}</h2>
        <p className="mt-1 text-sm leading-5 text-zinc-600">{item.body}</p>
      </div>
    </div>
  );
}

function CallQueue({ result }: { result: AdminDataResult<AdminRecord[]> }) {
  if (result.state === "empty") {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
        No calls captured yet. If you just ran the extension, confirm you were signed in to Radar
        in the same Chrome profile and clicked End in the popup.
      </div>
    );
  }

  if (result.state !== "ready") {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
        {result.message || "Connect the workspace database before Radar can load call records."}
      </div>
    );
  }

  if (result.data.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
        No calls captured yet. If you just ran the extension, confirm you were signed in to Radar
        in the same Chrome profile and clicked End in the popup.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
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
              <h2 className="text-sm font-semibold text-zinc-950">
                {title || id || "Untitled call"}
              </h2>
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

function toDisplayValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

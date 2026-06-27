import Link from "next/link";
import { FileText, MessageSquareText, Radio, ShieldCheck } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-surfaces";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AdminDataResult, AdminRecord } from "@/lib/admin-data";

export function SessionDetailPage({
  result,
}: {
  result: AdminDataResult<AdminRecord>;
}) {
  if (result.state !== "ready") {
    return (
      <>
        <AdminPageHeader
          title="Call review"
          description="Review a completed Radar session after the extension ends a call."
        />
        <Card className="rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle>No call loaded</CardTitle>
            <CardDescription>
              {result.state === "not_configured" ? result.message : result.message}
            </CardDescription>
          </CardHeader>
        </Card>
      </>
    );
  }

  const record = result.data;
  const title = displayValue(record.title) || `Call ${displayValue(record.id).slice(0, 8)}`;
  const status = displayValue(record.status);
  const segments = arrayValue(record.segments);
  const cards = arrayValue(record.cards);
  const events = arrayValue(record.events);

  return (
    <>
      <AdminPageHeader
        title={title}
        description="Call review for transcript capture, cited guidance, and session events."
      >
        <Button asChild variant="outline">
          <Link href="/app/sessions">Back to calls</Link>
        </Button>
      </AdminPageHeader>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          <section className="grid gap-3 md:grid-cols-4">
            <ReviewStat icon={Radio} label="Status" value={status || "unknown"} />
            <ReviewStat icon={FileText} label="Transcript segments" value={String(segments.length)} />
            <ReviewStat icon={ShieldCheck} label="Guidance cards" value={String(cards.length)} />
            <ReviewStat icon={MessageSquareText} label="Events" value={String(events.length)} />
          </section>

          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle>Transcript</CardTitle>
              <CardDescription>
                Final microphone segments appear here when Realtime transcription returns text.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {segments.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {segments.map((segment, index) => (
                    <div key={displayValue(segment.id) || index} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <Badge variant="outline">{displayValue(segment.source) || "microphone"}</Badge>
                        <span className="text-xs text-zinc-500">{displayValue(segment.created_at)}</span>
                      </div>
                      <p className="text-sm leading-6 text-zinc-800">{displayValue(segment.text)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyReviewState message="This call was saved, but no final transcript segments were captured. If microphone was enabled, check browser mic permission and Realtime connection state in the extension popup." />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle>Guidance</CardTitle>
              <CardDescription>
                Proof cards require citations. Unsupported claims stay as Needs confirmation or Escalate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cards.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {cards.map((card, index) => (
                    <div key={displayValue(card.id) || index} className="rounded-lg border border-zinc-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-sm font-semibold text-zinc-950">
                          {displayValue(card.title) || displayValue(card.card_type) || "Guidance card"}
                        </h2>
                        <Badge variant="outline">{displayValue(card.lane) || displayValue(card.card_type)}</Badge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-zinc-600">
                        {displayValue(card.summary) || displayValue(card.message) || "Review card details in the stored payload."}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyReviewState message="No guidance cards were generated for this call." />
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Session details</CardTitle>
            <CardDescription>Stored from the extension session lifecycle.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <DetailRow label="Created by" value={displayValue(record.created_by_email)} />
            <DetailRow label="Created" value={displayValue(record.created_at)} />
            <DetailRow label="Ended" value={displayValue(record.ended_at)} />
            <DetailRow label="Session ID" value={displayValue(record.id)} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ReviewStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Radio;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-lg shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-950 text-white">
            <Icon />
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-zinc-950">{value}</div>
            <div className="text-xs text-zinc-500">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className="mt-1 break-words text-zinc-950">{value || "Not recorded"}</div>
    </div>
  );
}

function EmptyReviewState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
      {message}
    </div>
  );
}

function arrayValue(value: unknown): AdminRecord[] {
  return Array.isArray(value) ? (value as AdminRecord[]) : [];
}

function displayValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

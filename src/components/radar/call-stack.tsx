import {
  BadgeCheck,
  FileCheck2,
  Radio,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type CallStackItem = {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: "idle" | "ready" | "warning";
};

const callStackItems: CallStackItem[] = [
  {
    icon: Radio,
    title: "Live capture",
    description: "Starts only after the call and workspace policy checks pass.",
    tone: "idle",
  },
  {
    icon: ShieldCheck,
    title: "Answer policy",
    description: "Unsupported claims become ask, confirm, or escalate.",
    tone: "ready",
  },
  {
    icon: FileCheck2,
    title: "Source citations",
    description: "Guidance waits for approved Knowledge Studio sources.",
    tone: "warning",
  },
];

const toneStyles = {
  idle: {
    icon: "bg-zinc-50 text-zinc-500",
    check: "border-zinc-300 text-zinc-300",
  },
  ready: {
    icon: "bg-emerald-50 text-emerald-600",
    check: "border-emerald-500 text-emerald-500",
  },
  warning: {
    icon: "bg-amber-50 text-amber-600",
    check: "border-zinc-300 text-zinc-300",
  },
} satisfies Record<CallStackItem["tone"], { icon: string; check: string }>;

export function RadarCallStack({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative min-h-[26rem] overflow-hidden rounded-[2rem] border border-zinc-200 bg-[#FAFAFA] bg-[radial-gradient(#CECECE_1px,transparent_1px)] p-5 [background-size:16px_16px]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/90 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/95 to-transparent" />

      <div className="relative mx-auto mt-5 max-w-[28rem] rotate-[-4deg] rounded-[2rem] border border-zinc-200 bg-white/92 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
        <div className="flex items-center gap-3 rounded-full border border-zinc-200 bg-white px-4 py-3 shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-950">
              Hidden until needed
            </p>
            <p className="mt-1 text-sm leading-5 text-zinc-500">
              Appears only when a supported call is active.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white">
            <Radio className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {callStackItems.map((item) => {
            const Icon = item.icon;
            const tone = toneStyles[item.tone];

            return (
              <div
                key={item.title}
                className="flex items-center gap-4 rounded-[1.35rem] border border-zinc-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
              >
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                    tone.icon
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-zinc-950">{item.title}</h3>
                  <p className="mt-1 text-sm leading-5 text-zinc-500">
                    {item.description}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-white",
                    tone.check
                  )}
                >
                  <BadgeCheck className="h-4 w-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import {
  BadgeCheck,
  BookOpenCheck,
  FileWarning,
  Radio,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Connect approved knowledge",
    description:
      "Admins connect sources, owners, playbooks, and approval gates before Radar can retrieve anything for a live conversation.",
    icon: BookOpenCheck,
    tone: "sky",
    rows: ["Source owner set", "Freshness policy active", "Playbook review required"],
  },
  {
    title: "Start with consent",
    description:
      "The browser overlay stays hidden until the rep confirms the call policy and the server mints a short-lived Realtime secret.",
    icon: Radio,
    tone: "emerald",
    rows: ["Call policy confirmed", "Realtime secret issued", "Capture status visible"],
  },
  {
    title: "Show proof or escalate",
    description:
      "Answer cards appear only with approved citations. Unsupported claims stay as Needs confirmation or Escalate for review.",
    icon: FileWarning,
    tone: "amber",
    rows: ["Citations required", "Needs confirmation state", "Escalation path recorded"],
  },
] satisfies Array<{
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "sky" | "emerald" | "amber";
  rows: string[];
}>;

const toneStyles = {
  sky: {
    background: "bg-[radial-gradient(circle_at_25%_10%,rgba(125,211,252,0.42),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(186,230,253,0.55),transparent_32%),#f8fbff]",
    icon: "bg-sky-600 text-white",
    line: "bg-sky-500",
    soft: "bg-sky-50 text-sky-700",
    border: "border-sky-100",
  },
  emerald: {
    background: "bg-[radial-gradient(circle_at_20%_15%,rgba(167,243,208,0.58),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(187,247,208,0.42),transparent_34%),#fbfffb]",
    icon: "bg-emerald-600 text-white",
    line: "bg-emerald-500",
    soft: "bg-emerald-50 text-emerald-700",
    border: "border-emerald-100",
  },
  amber: {
    background: "bg-[radial-gradient(circle_at_22%_14%,rgba(254,240,138,0.48),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(253,186,116,0.32),transparent_34%),#fffdf8]",
    icon: "bg-amber-500 text-white",
    line: "bg-amber-500",
    soft: "bg-amber-50 text-amber-800",
    border: "border-amber-100",
  },
} satisfies Record<
  (typeof steps)[number]["tone"],
  {
    background: string;
    icon: string;
    line: string;
    soft: string;
    border: string;
  }
>;

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full bg-[#eef2f7] px-4 py-24 md:px-6">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-medium leading-tight text-black md:text-6xl">
            What happens after sign in
          </h2>
          <p className="mt-6 text-lg leading-8 text-black/60">
            Radar walks teams through setup, consent, and cited guidance before any
            production conversation receives live assistance.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {steps.map((step, index) => (
            <StepCard key={step.title} step={step} index={index} />
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/auth/sign-in">Start onboarding</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app">Open dashboard</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function StepCard({
  step,
  index,
}: {
  step: (typeof steps)[number];
  index: number;
}) {
  const Icon = step.icon;
  const styles = toneStyles[step.tone];

  return (
    <article className="overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
      <div className={cn("p-6", styles.background)}>
        <div className="mx-auto flex min-h-[15rem] max-w-sm flex-col justify-between rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-2xl", styles.icon)}>
              <Icon className="h-5 w-5" />
            </span>
            <span className={cn("rounded-full px-3 py-1 text-xs font-medium", styles.soft)}>
              Step {index + 1} of {steps.length}
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {step.rows.map((row, rowIndex) => (
              <div
                key={row}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border bg-white px-3 py-2 text-sm text-black/70",
                  styles.border
                )}
              >
                <span className={cn("h-2.5 w-2.5 rounded-full", rowIndex === 1 ? "bg-zinc-300" : styles.line)} />
                <span className="min-w-0 flex-1 truncate">{row}</span>
                {rowIndex === 0 && <BadgeCheck className="h-4 w-4 text-emerald-600" />}
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <span className="text-xs font-medium text-black/40">Back</span>
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {steps.map((item, dotIndex) => (
                <span
                  key={item.title}
                  className={cn(
                    "h-1.5 rounded-full",
                    dotIndex === index ? "w-5 bg-black" : "w-1.5 bg-black/20"
                  )}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-black">Next</span>
          </div>
        </div>
      </div>

      <div className="p-6 text-center">
        <h3 className="text-xl font-semibold text-black">{step.title}</h3>
        <p className="mt-3 text-base leading-7 text-black/58">{step.description}</p>
      </div>
    </article>
  );
}

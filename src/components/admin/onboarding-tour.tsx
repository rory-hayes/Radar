"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Download,
  FileWarning,
  MonitorCheck,
  ShieldCheck,
  UserRoundCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type TourAudience = "admin" | "user";
type TourStep = {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "sky" | "emerald" | "amber";
  rows: string[];
  outcome: string;
  primaryAction?: {
    label: string;
    href: string;
  };
};

const storageKeys = {
  admin: "radar.v1.onboarding.admin.completed",
  user: "radar.v1.onboarding.user.completed",
} satisfies Record<TourAudience, string>;

const audienceCopy = {
  admin: {
    buttonLabel: "Workspace setup",
  },
  user: {
    buttonLabel: "User setup",
  },
} satisfies Record<TourAudience, { buttonLabel: string }>;

const tourStepsByAudience: Record<TourAudience, TourStep[]> = {
  admin: [
    {
      title: "Create the shared workspace",
      description:
        "Admins own the workspace setup: tenant policy, access rules, retention expectations, and the approved systems Radar can use.",
      icon: ShieldCheck,
      tone: "sky",
      rows: ["Workspace", "Policy", "Roles"],
      outcome: "Radar starts from one centrally managed workspace, not isolated individual knowledge.",
    },
    {
      title: "Connect the knowledge Radar can cite",
      description:
        "Add source systems, assign owners, and keep playbooks in review until they are approved for live use.",
      icon: BookOpenCheck,
      tone: "emerald",
      rows: ["Sources", "Owners", "Approvals"],
      outcome: "The live copilot stays quiet until approved evidence exists.",
    },
    {
      title: "Invite users into the same truth layer",
      description:
        "Admins invite reps, knowledge managers, approvers, analysts, and viewers into the workspace with role-based permissions.",
      icon: Users,
      tone: "amber",
      rows: ["Invite", "Role", "Onboarding"],
      outcome: "Each user gets personal setup, but knowledge remains centrally governed.",
    },
  ],
  user: [
    {
      title: "Accept the workspace invite",
      description:
        "Invited users join the existing workspace so every call uses the same approved sources, playbooks, and escalation rules.",
      icon: UserRoundCheck,
      tone: "sky",
      rows: ["Invite", "Workspace", "Profile"],
      outcome: "Users join the shared workspace instead of creating unmanaged personal knowledge.",
    },
    {
      title: "Learn the card states before live calls",
      description:
        "Users learn that cited cards can be used, Needs confirmation cards need caution, and unsupported claims should escalate.",
      icon: FileWarning,
      tone: "emerald",
      rows: ["Cited", "Confirm", "Escalate"],
      outcome: "Users know what to trust, what to check, and what to route back to the team.",
    },
    {
      title: "Install the Chrome extension",
      description:
        "Enable Radar Live Assist in Chrome, pin it to the toolbar, and start it only after call consent is clear.",
      icon: MonitorCheck,
      tone: "amber",
      rows: ["Install", "Pin", "Start"],
      outcome: "After a call ends, the session appears in Calls and rolls into analytics.",
      primaryAction: {
        label: "Download extension",
        href: "/api/extension/package",
      },
    },
  ],
};

const toneStyles = {
  sky: {
    wash: "bg-[radial-gradient(circle_at_20%_10%,rgba(125,211,252,0.44),transparent_34%),radial-gradient(circle_at_84%_20%,rgba(191,219,254,0.48),transparent_34%),#f8fbff]",
    icon: "bg-sky-600 text-white",
    dot: "bg-sky-500",
    text: "text-sky-700",
    ring: "border-sky-100",
  },
  emerald: {
    wash: "bg-[radial-gradient(circle_at_18%_12%,rgba(167,243,208,0.56),transparent_34%),radial-gradient(circle_at_84%_18%,rgba(187,247,208,0.42),transparent_34%),#fbfffb]",
    icon: "bg-emerald-600 text-white",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    ring: "border-emerald-100",
  },
  amber: {
    wash: "bg-[radial-gradient(circle_at_20%_12%,rgba(254,240,138,0.52),transparent_34%),radial-gradient(circle_at_84%_18%,rgba(253,186,116,0.34),transparent_34%),#fffdf8]",
    icon: "bg-amber-500 text-white",
    dot: "bg-amber-500",
    text: "text-amber-800",
    ring: "border-amber-100",
  },
} satisfies Record<
  TourStep["tone"],
  {
    wash: string;
    icon: string;
    dot: string;
    text: string;
    ring: string;
  }
>;

export function RadarOnboardingTour({
  audience = "admin",
  autoOpen = true,
}: {
  audience?: TourAudience;
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const steps = tourStepsByAudience[audience];
  const step = steps[stepIndex] ?? steps[0];
  const finalStep = stepIndex === steps.length - 1;
  const storageKey = storageKeys[audience];

  useEffect(() => {
    if (!autoOpen) {
      return;
    }

    try {
      if (window.localStorage.getItem(storageKey) !== "true") {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, [autoOpen, storageKey]);

  function markComplete() {
    try {
      window.localStorage.setItem(storageKey, "true");
    } catch {
      // Storage can be unavailable in restricted browsing contexts.
    }

    setOpen(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setStepIndex(0);
      setOpen(true);
      return;
    }

    markComplete();
  }

  function openTour() {
    setStepIndex(0);
    setOpen(true);
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={openTour}>
        <BookOpenCheck data-icon="inline-start" />
        {audienceCopy[audience].buttonLabel}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[calc(100vh-2rem)] max-w-[28rem] overflow-y-auto rounded-[2rem] border-0 bg-white p-0 shadow-[0_32px_90px_rgba(15,23,42,0.22)] sm:rounded-[2rem]">
          <div className={cn("p-6 sm:p-8", toneStyles[step.tone].wash)}>
            <TourVisual step={step} stepIndex={stepIndex} totalSteps={steps.length} />
          </div>

          <div className="px-6 pb-6 pt-1 sm:px-8 sm:pb-8">
            <DialogHeader className="items-center gap-3 text-center">
              <div className="flex items-center gap-1.5" aria-label={`Step ${stepIndex + 1} of ${steps.length}`}>
                {steps.map((item, index) => (
                  <button
                    key={item.title}
                    type="button"
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      index === stepIndex ? "w-6 bg-zinc-950" : "w-1.5 bg-zinc-300"
                    )}
                    aria-label={`Go to ${item.title}`}
                    aria-current={index === stepIndex ? "step" : undefined}
                    onClick={() => setStepIndex(index)}
                  />
                ))}
              </div>
              <DialogTitle className="text-balance text-2xl font-semibold leading-tight tracking-normal text-zinc-950">
                {step.title}
              </DialogTitle>
              <DialogDescription className="text-pretty text-base leading-7 text-zinc-600">
                {step.description}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-700">
              {step.outcome}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={stepIndex === 0}
                onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
              >
                <ArrowLeft data-icon="inline-start" />
                Back
              </Button>
              {finalStep ? (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  {step.primaryAction ? (
                    <Button asChild className="w-full sm:w-auto">
                      <a href={step.primaryAction.href}>
                        <Download data-icon="inline-start" />
                        {step.primaryAction.label}
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant={step.primaryAction ? "outline" : "default"}
                    className="w-full sm:w-auto"
                    onClick={markComplete}
                  >
                    Finish
                    <BadgeCheck data-icon="inline-end" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={() => setStepIndex((current) => Math.min(steps.length - 1, current + 1))}
                >
                  Next
                  <ArrowRight data-icon="inline-end" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TourVisual({
  step,
  stepIndex,
  totalSteps,
}: {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
}) {
  const Icon = step.icon;
  const styles = toneStyles[step.tone];

  return (
    <div className="mx-auto w-full max-w-[18rem] rounded-[1.75rem] border border-white/70 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <span className={cn("inline-flex h-11 w-11 items-center justify-center rounded-2xl", styles.icon)}>
          <Icon className="h-5 w-5" />
        </span>
        <span className={cn("text-xs font-semibold", styles.text)}>
          {stepIndex + 1} / {totalSteps}
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {step.rows.map((row, rowIndex) => (
          <div
            key={row}
            className={cn(
              "flex items-center gap-3 rounded-2xl border bg-white px-3 py-2 text-sm font-medium text-zinc-700",
              styles.ring
            )}
          >
            <span className={cn("h-2.5 w-2.5 rounded-full", rowIndex === 1 ? "bg-zinc-300" : styles.dot)} />
            <span className="min-w-0 flex-1 truncate">{row}</span>
            {rowIndex === 0 && <ShieldCheck className="h-4 w-4 text-emerald-600" />}
          </div>
        ))}
      </div>
    </div>
  );
}

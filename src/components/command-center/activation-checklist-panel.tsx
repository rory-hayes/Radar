import { ArrowRightIcon, CheckCircle2Icon, CircleIcon, LockIcon } from "lucide-react";
import Link from "next/link";

import { StatusBadge, type StatusTone } from "@/components/radar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { ActivationChecklist, ActivationStep } from "@/lib/onboarding/activation";

type ActivationChecklistPanelProps = {
  checklist: ActivationChecklist;
};

export function ActivationChecklistPanel({ checklist }: ActivationChecklistPanelProps) {
  if (checklist.isComplete) {
    return (
      <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle>Activation complete</CardTitle>
              <CardDescription>This workspace has completed the first meaningful verification path.</CardDescription>
            </div>
            <StatusBadge tone="pass" label="Ready" />
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card size="sm" className="rounded-lg border-border/80 shadow-[var(--radar-shadow-card)]">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-1.5">
            <CardTitle>Activation checklist</CardTitle>
            <CardDescription>
              Reach the first useful check by adding only the evidence and runner coverage this workspace needs.
            </CardDescription>
          </div>
          <StatusBadge tone={checklist.completedCount > 0 ? "running" : "neutral"} label={`${checklist.completedCount}/${checklist.totalCount}`} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">Workspace activation</span>
            <span className="text-muted-foreground">{checklist.progress}%</span>
          </div>
          <Progress value={checklist.progress} aria-label="Workspace activation progress" />
        </div>

        {checklist.currentStep ? (
          <Alert>
            <CurrentStepIcon step={checklist.currentStep} />
            <AlertTitle>{checklist.currentStep.title}</AlertTitle>
            <AlertDescription>{checklist.currentStep.description}</AlertDescription>
          </Alert>
        ) : null}

        <Separator />

        <div className="grid gap-3 lg:grid-cols-5">
          {checklist.steps.map((step) => (
            <ActivationStepItem key={step.id} step={step} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivationStepItem({ step }: { step: ActivationStep }) {
  const locked = step.status === "locked";

  return (
    <div className="flex min-h-44 flex-col justify-between rounded-md border bg-background p-3">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Checkbox checked={step.completed} disabled aria-label={`${step.title} completion`} />
          <StatusBadge tone={statusTone(step)} label={statusLabel(step)} />
        </div>
        <div>
          <h2 className="text-sm font-semibold">{step.title}</h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{step.description}</p>
        </div>
      </div>
      <Button asChild variant={step.status === "current" ? "default" : "outline"} size="sm" className="mt-3 w-full" disabled={locked}>
        {locked ? (
          <span>
            <LockIcon data-icon="inline-start" />
            Locked
          </span>
        ) : (
          <Link href={step.href}>
            {step.actionLabel}
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        )}
      </Button>
    </div>
  );
}

function CurrentStepIcon({ step }: { step: ActivationStep }) {
  if (step.status === "locked") return <LockIcon aria-hidden="true" />;
  if (step.completed) return <CheckCircle2Icon aria-hidden="true" />;
  return <CircleIcon aria-hidden="true" />;
}

function statusTone(step: ActivationStep): StatusTone {
  if (step.completed) return "pass";
  if (step.status === "current") return "running";
  return "neutral";
}

function statusLabel(step: ActivationStep) {
  if (step.completed) return "Done";
  if (step.status === "current") return "Next";
  return "Locked";
}

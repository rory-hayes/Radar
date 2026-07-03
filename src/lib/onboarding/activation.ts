import type { RadarAssertion } from "@/lib/assertions/schema";
import type { RadarFinding } from "@/lib/findings/schema";
import type { RadarEvaluationRunSummary } from "@/lib/repositories";
import type { RadarSource } from "@/lib/sources/schema";

export type ActivationStepId =
  | "connect_source"
  | "create_assertion"
  | "configure_runner"
  | "run_check"
  | "review_result";

export type ActivationStepStatus = "done" | "current" | "locked";

export type ActivationStep = {
  id: ActivationStepId;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  status: ActivationStepStatus;
  completed: boolean;
};

export type ActivationChecklist = {
  steps: ActivationStep[];
  completedCount: number;
  totalCount: number;
  progress: number;
  isComplete: boolean;
  currentStep?: ActivationStep;
};

type ActivationChecklistInput = {
  assertions: readonly RadarAssertion[];
  sources: readonly RadarSource[];
  runs: readonly RadarEvaluationRunSummary[];
  findings: readonly RadarFinding[];
  approvedTestCaseCount?: number;
};

const terminalRunStatuses = new Set(["passed", "warning", "failed", "inconclusive", "error", "canceled"]);

export function buildActivationChecklist({
  assertions,
  sources,
  runs,
  findings,
  approvedTestCaseCount = 0,
}: ActivationChecklistInput): ActivationChecklist {
  const hasSource = sources.length > 0;
  const hasAssertion = assertions.length > 0;
  const hasRunnerConfig = approvedTestCaseCount > 0;
  const hasRun = runs.length > 0;
  const hasReviewedResult = findings.length > 0 || runs.some((run) => terminalRunStatuses.has(run.status));
  const completion = [hasSource, hasAssertion, hasRunnerConfig, hasRun, hasReviewedResult];
  const firstIncompleteIndex = completion.findIndex((completed) => !completed);

  const steps = [
    {
      id: "connect_source" as const,
      title: "Connect first source",
      description: "Add the evidence Radar needs before defining a customer-facing assertion.",
      href: hasSource ? "/sources" : "/sources/new",
      actionLabel: hasSource ? "View sources" : "Add source",
    },
    {
      id: "create_assertion" as const,
      title: "Create first assertion",
      description: "Describe the business promise Radar should continuously verify.",
      href: hasAssertion ? "/assertions" : "/assertions/new",
      actionLabel: hasAssertion ? "View assertions" : "Create assertion",
    },
    {
      id: "configure_runner" as const,
      title: "Approve runner coverage",
      description: "Approve at least one test case so the correct runner can execute a real check.",
      href: firstAssertionHref(assertions),
      actionLabel: hasRunnerConfig ? "View coverage" : "Configure coverage",
    },
    {
      id: "run_check" as const,
      title: "Run first check",
      description: "Queue the first verification run from an assertion detail page.",
      href: firstAssertionHref(assertions),
      actionLabel: hasRun ? "View run history" : "Run check",
    },
    {
      id: "review_result" as const,
      title: "Review finding or report",
      description: "Inspect the first evidence-backed finding or weekly trust report.",
      href: findings.length > 0 ? "/findings" : "/reports/weekly",
      actionLabel: findings.length > 0 ? "Review findings" : "Open report",
    },
  ].map<ActivationStep>((step, index) => {
    const completed = completion[index] ?? false;
    const status: ActivationStepStatus = completed ? "done" : index === firstIncompleteIndex ? "current" : "locked";

    return {
      ...step,
      completed,
      status,
    };
  });

  const completedCount = completion.filter(Boolean).length;

  return {
    steps,
    completedCount,
    totalCount: steps.length,
    progress: Math.round((completedCount / steps.length) * 100),
    isComplete: completedCount === steps.length,
    currentStep: steps.find((step) => step.status === "current"),
  };
}

function firstAssertionHref(assertions: readonly RadarAssertion[]) {
  return assertions[0] ? `/assertions/${assertions[0].id}` : "/assertions/new";
}

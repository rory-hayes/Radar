import { assertionCategories, type AssertionCategory, type RadarAssertion } from "@/lib/assertions/schema";
import type { RadarFinding, FindingStatus } from "@/lib/findings/schema";
import type { RadarEvaluationRunSummary } from "@/lib/repositories";

export type WeeklyTrustReportMetric = {
  label: string;
  value: string;
  detail: string;
  tone: "pass" | "warning" | "fail" | "neutral";
};

export type WeeklyTrustReportFinding = {
  id: string;
  title: string;
  assertionId: string;
  assertionTitle: string;
  severity: RadarFinding["severity"];
  status: RadarFinding["status"];
  resolvedAt?: string;
  recommendedFix: string;
  customerImpact: string;
};

export type WeeklyTrustReportRiskCategory = {
  category: AssertionCategory;
  label: string;
  activeAssertions: number;
  activeFindings: number;
  criticalFindings: number;
  passRate: number | null;
  summary: string;
  tone: "pass" | "warning" | "fail" | "neutral";
};

export type WeeklyTrustReportAction = {
  id: string;
  title: string;
  description: string;
  tone: "pass" | "warning" | "fail" | "neutral";
  href?: string;
};

export type WeeklyTrustReport = {
  id: string;
  title: string;
  generatedAt: string;
  period: {
    start: string;
    end: string;
    label: string;
  };
  executiveSummary: string;
  metrics: WeeklyTrustReportMetric[];
  checksRun: number;
  passRate: number | null;
  activeExceptions: number;
  resolvedFindingsCount: number;
  riskyCategories: WeeklyTrustReportRiskCategory[];
  resolvedFindings: WeeklyTrustReportFinding[];
  openExceptions: WeeklyTrustReportFinding[];
  recommendedNextActions: WeeklyTrustReportAction[];
};

type GenerateWeeklyTrustReportInput = {
  assertions: readonly RadarAssertion[];
  findings: readonly RadarFinding[];
  runs: readonly RadarEvaluationRunSummary[];
  now?: Date;
  lookbackDays?: number;
};

const activeFindingStatuses = ["open", "investigating", "fixed"] as const satisfies readonly FindingStatus[];
const terminalRunStatuses = ["passed", "warning", "failed", "inconclusive", "error"] as const;
const oneDayMs = 24 * 60 * 60 * 1000;

export function generateWeeklyTrustReport({
  assertions,
  findings,
  runs,
  now = new Date(),
  lookbackDays = 7,
}: GenerateWeeklyTrustReportInput): WeeklyTrustReport {
  const periodEnd = now;
  const periodStart = new Date(periodEnd.getTime() - lookbackDays * oneDayMs);
  const periodRuns = runs.filter((run) => {
    const runTimestamp = run.completedAt ?? run.createdAt;
    return (terminalRunStatuses as readonly string[]).includes(run.status) && isWithinPeriod(runTimestamp, periodStart, periodEnd);
  });
  const activeFindings = findings.filter((finding) =>
    (activeFindingStatuses as readonly FindingStatus[]).includes(finding.status),
  );
  const resolvedFindings = findings.filter((finding) =>
    finding.resolvedAt ? isWithinPeriod(finding.resolvedAt, periodStart, periodEnd) : false,
  );
  const passRate = passRateForRuns(periodRuns);
  const assertionTitles = new Map(assertions.map((assertion) => [assertion.id, assertion.title]));
  const riskyCategories = buildRiskyCategories({ assertions, activeFindings, runs: periodRuns });
  const openExceptions = selectOpenExceptions(activeFindings, assertionTitles);
  const recommendedNextActions = buildRecommendedNextActions({
    assertions,
    checksRun: periodRuns.length,
    passRate,
    activeFindings,
    riskyCategories,
    openExceptions,
  });

  return {
    id: `weekly-trust-report:${periodStart.toISOString()}:${periodEnd.toISOString()}`,
    title: "Weekly trust report",
    generatedAt: periodEnd.toISOString(),
    period: {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
      label: `${formatDate(periodStart)} to ${formatDate(periodEnd)}`,
    },
    executiveSummary: buildExecutiveSummary({
      checksRun: periodRuns.length,
      passRate,
      activeExceptions: activeFindings.length,
      resolvedFindings: resolvedFindings.length,
      riskyCategories: riskyCategories.length,
    }),
    metrics: [
      {
        label: "Checks run",
        value: String(periodRuns.length),
        detail: `Completed in the last ${lookbackDays} days`,
        tone: periodRuns.length > 0 ? "pass" : "neutral",
      },
      {
        label: "Pass rate",
        value: passRate === null ? "No runs" : `${passRate}%`,
        detail: "Passed test cases in completed checks",
        tone: passRateTone(passRate),
      },
      {
        label: "Active exceptions",
        value: String(activeFindings.length),
        detail: "Open, investigating, or fixed findings",
        tone: activeFindings.length === 0 ? "pass" : hasCritical(activeFindings) ? "fail" : "warning",
      },
      {
        label: "Resolved findings",
        value: String(resolvedFindings.length),
        detail: `Closed in the last ${lookbackDays} days`,
        tone: resolvedFindings.length > 0 ? "pass" : "neutral",
      },
    ],
    checksRun: periodRuns.length,
    passRate,
    activeExceptions: activeFindings.length,
    resolvedFindingsCount: resolvedFindings.length,
    riskyCategories,
    resolvedFindings: resolvedFindings.map((finding) => mapReportFinding(finding, assertionTitles)),
    openExceptions,
    recommendedNextActions,
  };
}

function buildRiskyCategories({
  assertions,
  activeFindings,
  runs,
}: {
  assertions: readonly RadarAssertion[];
  activeFindings: readonly RadarFinding[];
  runs: readonly RadarEvaluationRunSummary[];
}): WeeklyTrustReportRiskCategory[] {
  return assertionCategories
    .map((category) => {
      const categoryAssertions = assertions.filter((assertion) => assertion.category === category);
      const assertionIds = new Set(categoryAssertions.map((assertion) => assertion.id));
      const categoryFindings = activeFindings.filter((finding) => assertionIds.has(finding.assertionId));
      const categoryRuns = runs.filter((run) => assertionIds.has(run.assertionId));
      const passRate = passRateForRuns(categoryRuns);
      const criticalFindings = categoryFindings.filter((finding) => finding.severity === "critical").length;
      const tone = riskTone({ criticalFindings, activeFindings: categoryFindings.length, passRate });

      return {
        category,
        label: categoryLabel(category),
        activeAssertions: categoryAssertions.filter((assertion) => assertion.status === "active").length,
        activeFindings: categoryFindings.length,
        criticalFindings,
        passRate,
        summary: categorySummary({ criticalFindings, activeFindings: categoryFindings.length, passRate }),
        tone,
      };
    })
    .filter((category) => category.tone !== "pass" && category.activeAssertions > 0)
    .sort((a, b) => (
      riskRank(a.tone) - riskRank(b.tone)
      || b.criticalFindings - a.criticalFindings
      || b.activeFindings - a.activeFindings
      || (a.passRate ?? 101) - (b.passRate ?? 101)
    ))
    .slice(0, 4);
}

function selectOpenExceptions(
  findings: readonly RadarFinding[],
  assertionTitles: ReadonlyMap<string, string>,
  limit = 5,
): WeeklyTrustReportFinding[] {
  return [...findings]
    .sort((a, b) => (
      severityRank(a.severity) - severityRank(b.severity)
      || statusRank(a.status) - statusRank(b.status)
      || b.confidence - a.confidence
      || a.title.localeCompare(b.title)
    ))
    .slice(0, limit)
    .map((finding) => mapReportFinding(finding, assertionTitles));
}

function buildRecommendedNextActions({
  assertions,
  checksRun,
  passRate,
  activeFindings,
  riskyCategories,
  openExceptions,
}: {
  assertions: readonly RadarAssertion[];
  checksRun: number;
  passRate: number | null;
  activeFindings: readonly RadarFinding[];
  riskyCategories: readonly WeeklyTrustReportRiskCategory[];
  openExceptions: readonly WeeklyTrustReportFinding[];
}): WeeklyTrustReportAction[] {
  const actions: WeeklyTrustReportAction[] = [];
  const criticalFinding = openExceptions.find((finding) => finding.severity === "critical");
  const topRiskCategory = riskyCategories[0];

  if (criticalFinding) {
    actions.push({
      id: `resolve:${criticalFinding.id}`,
      title: "Resolve the highest-risk finding",
      description: `${criticalFinding.title} is the top customer-facing exception to clear or validate.`,
      tone: "fail",
      href: `/findings?findingId=${criticalFinding.id}`,
    });
  }

  if (topRiskCategory) {
    actions.push({
      id: `category:${topRiskCategory.category}`,
      title: `Stabilize ${topRiskCategory.label}`,
      description: topRiskCategory.summary,
      tone: topRiskCategory.tone,
      href: "/assertions",
    });
  }

  if (passRate !== null && passRate < 90) {
    actions.push({
      id: "pass-rate",
      title: "Review failed and warning checks",
      description: `Weekly pass rate is ${passRate}%, so prioritize evidence review and fix validation reruns.`,
      tone: passRate < 80 ? "fail" : "warning",
      href: "/findings",
    });
  }

  if (checksRun === 0 && assertions.some((assertion) => assertion.status === "active")) {
    actions.push({
      id: "run-active-assertions",
      title: "Run active assertions",
      description: "No completed checks landed this week, so start with the active assertions that have approved coverage.",
      tone: "warning",
      href: "/assertions",
    });
  }

  if (actions.length === 0 && activeFindings.length === 0) {
    actions.push({
      id: "maintain-coverage",
      title: "Maintain assertion coverage",
      description: "No active exceptions need escalation; keep scheduled checks and source syncs current.",
      tone: "pass",
      href: "/command-center",
    });
  }

  return actions.slice(0, 4);
}

function mapReportFinding(
  finding: RadarFinding,
  assertionTitles: ReadonlyMap<string, string>,
): WeeklyTrustReportFinding {
  return {
    id: finding.id,
    title: finding.title,
    assertionId: finding.assertionId,
    assertionTitle: assertionTitles.get(finding.assertionId) ?? "Assertion unavailable",
    severity: finding.severity,
    status: finding.status,
    resolvedAt: finding.resolvedAt,
    recommendedFix: finding.recommendedFix,
    customerImpact: finding.customerImpact,
  };
}

function buildExecutiveSummary(input: {
  checksRun: number;
  passRate: number | null;
  activeExceptions: number;
  resolvedFindings: number;
  riskyCategories: number;
}) {
  const passRateText = input.passRate === null ? "no completed-check pass rate yet" : `${input.passRate}% pass rate`;
  const exceptionText =
    input.activeExceptions === 0
      ? "no active customer-facing exceptions"
      : `${input.activeExceptions} active customer-facing exception${input.activeExceptions === 1 ? "" : "s"}`;
  const resolvedText =
    input.resolvedFindings === 0
      ? "no findings resolved this week"
      : `${input.resolvedFindings} finding${input.resolvedFindings === 1 ? "" : "s"} resolved this week`;

  return `Radar completed ${input.checksRun} checks with ${passRateText}, found ${exceptionText}, and recorded ${resolvedText}. ${input.riskyCategories} assertion categor${input.riskyCategories === 1 ? "y needs" : "ies need"} attention.`;
}

function passRateForRuns(runs: readonly RadarEvaluationRunSummary[]) {
  const totals = runs.reduce(
    (counts, run) => ({
      passed: counts.passed + run.passedCount,
      checked: counts.checked + run.passedCount + run.warningCount + run.failedCount + run.errorCount,
    }),
    { passed: 0, checked: 0 },
  );

  if (totals.checked === 0) {
    return null;
  }

  return Math.round((totals.passed / totals.checked) * 100);
}

function categorySummary(input: { criticalFindings: number; activeFindings: number; passRate: number | null }) {
  if (input.criticalFindings > 0) {
    return `${input.criticalFindings} critical finding${input.criticalFindings === 1 ? "" : "s"} require executive attention.`;
  }
  if (input.activeFindings > 0) {
    return `${input.activeFindings} active finding${input.activeFindings === 1 ? "" : "s"} should be reviewed.`;
  }
  if (input.passRate !== null && input.passRate < 80) {
    return `Pass rate is ${input.passRate}%, below the weekly trust threshold.`;
  }
  return "No elevated risk this week.";
}

function riskTone(input: {
  criticalFindings: number;
  activeFindings: number;
  passRate: number | null;
}): WeeklyTrustReportRiskCategory["tone"] {
  if (input.criticalFindings > 0) return "fail";
  if (input.activeFindings > 0) return "warning";
  if (input.passRate !== null && input.passRate < 80) return "warning";
  return "pass";
}

function passRateTone(passRate: number | null): WeeklyTrustReportMetric["tone"] {
  if (passRate === null) return "neutral";
  if (passRate >= 95) return "pass";
  if (passRate >= 80) return "warning";
  return "fail";
}

function isWithinPeriod(value: string, start: Date, end: Date) {
  const timestamp = new Date(value).getTime();
  return timestamp >= start.getTime() && timestamp <= end.getTime();
}

function hasCritical(findings: readonly RadarFinding[]) {
  return findings.some((finding) => finding.severity === "critical");
}

function categoryLabel(category: AssertionCategory) {
  const labels: Record<AssertionCategory, string> = {
    pricing: "Pricing",
    refund_cancellation: "Refund / cancellation",
    trial_onboarding: "Trial onboarding",
    billing_invoices: "Billing / invoices",
    support_escalation: "Support escalation",
    custom: "Custom",
  };

  return labels[category];
}

function severityRank(severity: RadarFinding["severity"]) {
  const ranks: Record<RadarFinding["severity"], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return ranks[severity];
}

function statusRank(status: RadarFinding["status"]) {
  const ranks: Record<RadarFinding["status"], number> = {
    open: 0,
    investigating: 1,
    fixed: 2,
    resolved: 3,
    ignored: 4,
    false_positive: 5,
  };

  return ranks[status];
}

function riskRank(tone: WeeklyTrustReportRiskCategory["tone"]) {
  const ranks: Record<WeeklyTrustReportRiskCategory["tone"], number> = {
    fail: 0,
    warning: 1,
    neutral: 2,
    pass: 3,
  };

  return ranks[tone];
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

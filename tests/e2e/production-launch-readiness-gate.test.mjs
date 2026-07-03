import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-100 gate verifies the complete assertion-led launch flow", async () => {
  const commandCenterPage = await readWorkspaceFile("src/app/(app)/command-center/page.tsx");
  const sourcesActions = await readWorkspaceFile("src/app/(app)/sources/actions.ts");
  const assertionsActions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");
  const jobOrchestration = await readWorkspaceFile("src/lib/evaluation/job-orchestration.ts");
  const knowledgeRunner = await readWorkspaceFile("src/lib/evaluation/knowledge-runner.ts");
  const journeyRunner = await readWorkspaceFile("src/lib/evaluation/journey-runner.ts");
  const integrationRunner = await readWorkspaceFile("src/lib/evaluation/integration-runner.ts");
  const findingsActions = await readWorkspaceFile("src/app/(app)/findings/actions.ts");
  const weeklyReportPage = await readWorkspaceFile("src/app/(app)/reports/weekly/page.tsx");
  const emailRoute = await readWorkspaceFile("src/app/api/notifications/email/route.ts");
  const slackRoute = await readWorkspaceFile("src/app/api/notifications/slack/route.ts");
  const activation = await readWorkspaceFile("src/lib/onboarding/activation.ts");
  const kpiSummary = await readWorkspaceFile("src/lib/command-center/kpi-summary.ts");

  assert.match(commandCenterPage, /requireActiveWorkspace/);
  assert.match(commandCenterPage, /buildCommandCenterKpiSummary/);
  assert.match(kpiSummary, /buildActivationChecklist/);
  assert.match(sourcesActions, /createSourceAction/);
  assert.match(sourcesActions, /syncSourceAction/);
  assert.match(assertionsActions, /createAssertionAction/);
  assert.match(assertionsActions, /queueManualAssertionRunAction/);
  assert.match(jobOrchestration, /queueEvaluationJob/);
  assert.match(jobOrchestration, /claimQueuedEvaluationRun/);
  assert.match(knowledgeRunner, /runKnowledgeEvaluationJob/);
  assert.match(journeyRunner, /runJourneyBrowserSession/);
  assert.match(integrationRunner, /runIntegrationEvaluationJob/);
  assert.match(findingsActions, /updateFindingLifecycleAction/);
  assert.match(findingsActions, /queueFindingRerunAction/);
  assert.match(weeklyReportPage, /generateWeeklyTrustReport/);
  assert.match(emailRoute, /sendWorkspaceNotificationEmails/);
  assert.match(slackRoute, /sendWorkspaceSlackAlert/);
  assert.match(activation, /connect_source/);
  assert.match(activation, /review_result/);
});

test("RAD-100 gate verifies security billing data lifecycle and abuse controls", async () => {
  const validateEnv = await readWorkspaceFile("scripts/validate-env.mjs");
  const security = await readWorkspaceFile("docs/SECURITY.md");
  const billing = await readWorkspaceFile("docs/BILLING.md");
  const dataLifecycle = await readWorkspaceFile("docs/DATA_LIFECYCLE.md");
  const nextConfig = await readWorkspaceFile("next.config.ts");
  const stripeWebhook = await readWorkspaceFile("src/app/api/billing/stripe-webhook/route.ts");
  const billingEnforcement = await readWorkspaceFile("src/lib/billing/enforcement.ts");
  const sourceActions = await readWorkspaceFile("src/app/(app)/sources/actions.ts");
  const assertionActions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");
  const exportRoute = await readWorkspaceFile("src/app/api/workspace/export/route.ts");
  const settingsPage = await readWorkspaceFile("src/app/(app)/settings/page.tsx");
  const abuseMigration = await readWorkspaceFile("supabase/migrations/20260703132000_create_abuse_limit_events.sql");

  for (const envKey of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_POSTHOG_KEY",
    "NEXT_PUBLIC_SENTRY_DSN",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "OPENAI_API_KEY",
    "TRIGGER_SECRET_KEY",
    "RESEND_API_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "SENTRY_AUTH_TOKEN",
  ]) {
    assert.match(validateEnv, new RegExp(envKey));
  }

  assert.match(nextConfig, /Content-Security-Policy-Report-Only/);
  assert.match(nextConfig, /X-Frame-Options/);
  assert.match(stripeWebhook, /verifyStripeWebhookSignature/);
  assert.match(stripeWebhook, /Invalid Stripe payload/);
  assert.match(billingEnforcement, /getWorkspaceBillingUsage/);
  assert.match(sourceActions, /getBillingGateResult/);
  assert.match(assertionActions, /getBillingGateResult/);
  assert.match(exportRoute, /workspace:manage/);
  assert.match(exportRoute, /buildWorkspaceExportPayload/);
  assert.match(settingsPage, /WorkspaceDataLifecyclePanel/);
  assert.match(abuseMigration, /enable row level security/);
  assert.match(abuseMigration, /force row level security/);
  assert.match(security, /Launch security bar/);
  assert.match(security, /Rate Limits, Quotas, And Abuse Controls/);
  assert.match(billing, /Workspace admins can start checkout or open the billing portal from Settings/);
  assert.match(dataLifecycle, /Exports deliberately omit encrypted runner credential values/);
});

test("RAD-100 gate verifies observability performance deployment and rollback readiness", async () => {
  const packageJson = JSON.parse(await readWorkspaceFile("package.json"));
  const ci = await readWorkspaceFile(".github/workflows/ci.yml");
  const testStrategy = await readWorkspaceFile("docs/TEST_STRATEGY.md");
  const observability = await readWorkspaceFile("docs/OBSERVABILITY.md");
  const performance = await readWorkspaceFile("docs/PERFORMANCE_AND_LOAD.md");
  const runbook = await readWorkspaceFile("docs/PRODUCTION_OPERATIONS_RUNBOOK.md");
  const instrumentation = await readWorkspaceFile("src/instrumentation.ts");
  const sentry = await readWorkspaceFile("src/lib/observability/sentry.ts");
  const langfuse = await readWorkspaceFile("src/lib/observability/langfuse-otel.ts");

  assert.equal(packageJson.scripts["perf:pilot"], "node scripts/run-pilot-load-smoke.mjs");
  assert.equal(packageJson.scripts["db:harness:apply"], "node scripts/verify-db-harness.mjs --apply");
  assert.match(ci, /E2E smoke tests/);
  assert.match(ci, /Pilot performance smoke/);
  assert.match(ci, /pnpm build/);
  assert.match(testStrategy, /pnpm perf:pilot/);
  assert.match(performance, /Pilot profile/);
  assert.match(performance, /pnpm perf:pilot/);
  assert.match(observability, /Sentry/);
  assert.match(observability, /Langfuse/);
  assert.match(instrumentation, /registerLangfuseTracing/);
  assert.match(instrumentation, /captureRequestError/);
  assert.match(sentry, /sendDefaultPii: false/);
  assert.match(langfuse, /sanitizeLangfuseData/);
  assert.match(runbook, /Release Preflight/);
  assert.match(runbook, /Migration Procedure/);
  assert.match(runbook, /Rollback/);
  assert.match(runbook, /Incident Response/);
  assert.match(runbook, /Launch Checklist/);
  assert.match(runbook, /pnpm audit --audit-level high/);
  assert.match(runbook, /pnpm exec supabase db push --dry-run --linked/);
});

test("RAD-100 gate verifies phase completion and product scope remain locked", async () => {
  const tasks = await readWorkspaceFile("tasks/TASKS.md");
  const task = await readWorkspaceFile("tasks/phase-9-production-readiness/rad-100-e2e-gate-10-production-launch-readiness.md");
  const routes = await readWorkspaceFile("src/lib/radar-routes.ts");
  const sidebar = await readWorkspaceFile("src/components/app-shell/sidebar-nav.tsx");
  const productScope = await readWorkspaceFile("docs/PRODUCT_SCOPE.md");
  const phaseNineSources = [
    await readWorkspaceFile("src/app/(app)/settings/page.tsx"),
    await readWorkspaceFile("src/app/api/billing/stripe-webhook/route.ts"),
    await readWorkspaceFile("src/app/api/workspace/export/route.ts"),
    await readWorkspaceFile("src/lib/observability/sentry.ts"),
    await readWorkspaceFile("src/lib/observability/langfuse-otel.ts"),
    await readWorkspaceFile("src/lib/abuse/enforcement.ts"),
    await readWorkspaceFile("scripts/run-pilot-load-smoke.mjs"),
  ];

  for (const ticket of ["RAD-091", "RAD-092", "RAD-093", "RAD-094", "RAD-095", "RAD-096", "RAD-097", "RAD-098", "RAD-099", "RAD-100"]) {
    assert.match(tasks, new RegExp(`${ticket}[\\s\\S]*Done`));
  }

  assert.match(task, /Gate report/);
  assert.match(task, /Result: Done/);
  assert.match(routes, /title: "Command Center"/);
  assert.match(routes, /title: "Assertions"/);
  assert.match(routes, /title: "Findings"/);
  assert.match(routes, /title: "Sources"/);
  assert.match(productScope, /Production hardening for controlled pilots/);
  assert.match(productScope, /Full observability product/);
  assert.match(productScope, /Full integration marketplace/);
  assert.doesNotMatch(sidebar, /Prompt Playground|Trace Explorer|Workflow Canvas|Marketplace|Analytics/i);

  for (const source of phaseNineSources) {
    assert.doesNotMatch(source, /generic eval platform|prompt playground|trace explorer|workflow canvas|integration marketplace/i);
    assert.doesNotMatch(source, /Bearer [A-Za-z0-9._-]{12,}|sk_live_[A-Za-z0-9]|sb_secret_[A-Za-z0-9]/i);
    assert.doesNotMatch(source, /console\.(log|error|warn)/);
  }
});

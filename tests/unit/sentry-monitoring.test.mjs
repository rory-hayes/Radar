import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function fileExists(relativePath) {
  await access(relativePath);
  return true;
}

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-093 installs and configures Sentry for Next.js builds", async () => {
  const pkg = await readWorkspaceFile("package.json");
  const nextConfig = await readWorkspaceFile("next.config.ts");
  const workspace = await readWorkspaceFile("pnpm-workspace.yaml");

  assert.match(pkg, /"@sentry\/nextjs"/);
  assert.match(nextConfig, /withSentryConfig/);
  assert.match(nextConfig, /SENTRY_ORG/);
  assert.match(nextConfig, /SENTRY_PROJECT/);
  assert.match(nextConfig, /SENTRY_AUTH_TOKEN/);
  assert.match(nextConfig, /widenClientFileUpload: true/);
  assert.match(nextConfig, /deleteSourcemapsAfterUpload: true/);
  assert.match(nextConfig, /tunnelRoute: "\/monitoring"/);
  assert.match(workspace, /'@sentry\/cli': true/);
});

test("RAD-093 initializes client server and edge Sentry runtimes", async () => {
  for (const path of [
    "src/instrumentation-client.ts",
    "src/instrumentation.ts",
    "src/sentry.server.config.ts",
    "src/sentry.edge.config.ts",
    "src/app/global-error.tsx",
  ]) {
    await fileExists(path);
  }

  const client = await readWorkspaceFile("src/instrumentation-client.ts");
  const instrumentation = await readWorkspaceFile("src/instrumentation.ts");
  const server = await readWorkspaceFile("src/sentry.server.config.ts");
  const edge = await readWorkspaceFile("src/sentry.edge.config.ts");
  const globalError = await readWorkspaceFile("src/app/global-error.tsx");

  assert.match(client, /Sentry\.init/);
  assert.match(client, /captureRouterTransitionStart/);
  assert.match(instrumentation, /NEXT_RUNTIME === "nodejs"/);
  assert.match(instrumentation, /NEXT_RUNTIME === "edge"/);
  assert.match(instrumentation, /captureRequestError/);
  assert.match(server, /buildRadarSentryOptions\("server"\)/);
  assert.match(edge, /buildRadarSentryOptions\("edge"\)/);
  assert.match(globalError, /Sentry\.captureException\(error\)/);
});

test("RAD-093 filters secrets source content and PII before sending events", async () => {
  const sentry = await readWorkspaceFile("src/lib/observability/sentry.ts");
  const guardrails = await readWorkspaceFile("src/lib/server/guardrails.ts");
  const proxy = await readWorkspaceFile("src/proxy.ts");

  assert.match(sentry, /sendDefaultPii: false/);
  assert.match(sentry, /beforeSend: scrubSentryEvent/);
  assert.match(sentry, /beforeBreadcrumb: scrubSentryBreadcrumb/);
  assert.match(sentry, /authorization\|cookie\|password\|secret\|token/);
  assert.match(sentry, /source\|content\|chunk\|embedding\|evidence\|prompt\|completion\|raw\|body/);
  assert.match(sentry, /radar_privacy: "source_content_filtered"/);
  assert.match(guardrails, /Sentry\.captureException/);
  assert.match(guardrails, /radar_boundary: "server_guardrail"/);
  assert.match(proxy, /monitoring/);
});

test("RAD-093 documents Sentry env and completion", async () => {
  const envSchema = await readWorkspaceFile("src/lib/env/schema.ts");
  const envScript = await readWorkspaceFile("scripts/validate-env.mjs");
  const docs = await readWorkspaceFile("docs/OBSERVABILITY.md");
  const task = await readWorkspaceFile("tasks/phase-9-production-readiness/rad-093-add-sentry-error-monitoring-and-release-tracking.md");
  const tasks = await readWorkspaceFile("tasks/TASKS.md");

  assert.match(envSchema, /SENTRY_ORG/);
  assert.match(envSchema, /SENTRY_PROJECT/);
  assert.match(envSchema, /SENTRY_RELEASE/);
  assert.match(envScript, /SENTRY_ORG/);
  assert.match(docs, /source-map upload/);
  assert.match(docs, /sendDefaultPii/);
  assert.match(task, /Result: Done/);
  assert.match(task, /Docker daemon/);
  assert.match(tasks, /RAD-093[\s\S]*Done/);
});

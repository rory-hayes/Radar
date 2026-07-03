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

test("RAD-094 installs Langfuse tracing with Node OpenTelemetry registration", async () => {
  await fileExists("src/lib/observability/langfuse.ts");
  await fileExists("src/lib/observability/langfuse-otel.ts");

  const packageJson = JSON.parse(await readWorkspaceFile("package.json"));
  const instrumentation = await readWorkspaceFile("src/instrumentation.ts");
  const otel = await readWorkspaceFile("src/lib/observability/langfuse-otel.ts");
  const sentry = await readWorkspaceFile("src/lib/observability/sentry.ts");

  assert.equal(packageJson.dependencies["@langfuse/tracing"], "^5.9.1");
  assert.equal(packageJson.dependencies["@langfuse/otel"], "^5.9.1");
  assert.equal(packageJson.dependencies["@opentelemetry/sdk-trace-node"], "^2.8.0");
  assert.match(instrumentation, /registerLangfuseTracing/);
  assert.match(instrumentation, /NEXT_RUNTIME === "nodejs"/);
  assert.match(otel, /new NodeTracerProvider/);
  assert.match(otel, /new LangfuseSpanProcessor/);
  assert.match(otel, /langfuseProvider\.register\(\)/);
  assert.match(otel, /shouldExportSpan: \(\{ otelSpan \}\) => otelSpan\.name\.startsWith\("radar\.llm\."\)/);
  assert.match(sentry, /skipOpenTelemetrySetup: runtime !== "client"/);
});

test("RAD-094 traces LLM generations with versions usage latency and fingerprints", async () => {
  const tracing = await readWorkspaceFile("src/lib/observability/langfuse.ts");
  const provider = await readWorkspaceFile("src/lib/llm/openai-responses.ts");

  assert.match(tracing, /server-only/);
  assert.match(tracing, /startObservation/);
  assert.match(tracing, /asType: "generation"/);
  assert.match(tracing, /promptVersion/);
  assert.match(tracing, /promptId/);
  assert.match(tracing, /task/);
  assert.match(tracing, /latencyMs/);
  assert.match(tracing, /usageDetails/);
  assert.match(tracing, /inputFingerprint/);
  assert.match(tracing, /outputFingerprint/);
  assert.match(tracing, /costTracking: "langfuse_model_usage_inference"/);
  assert.match(provider, /traceRadarLlmGeneration/);
  assert.match(provider, /fingerprintLlmTraceOutput/);
  assert.match(provider, /langfuse: traced\.trace/);
  assert.match(provider, /latencyMs: traced\.trace\.latencyMs/);
});

test("RAD-094 keeps Langfuse metadata redacted and internal-only", async () => {
  const tracing = await readWorkspaceFile("src/lib/observability/langfuse.ts");
  const otel = await readWorkspaceFile("src/lib/observability/langfuse-otel.ts");
  const docs = await readWorkspaceFile("docs/OBSERVABILITY.md");

  assert.doesNotMatch(tracing, /promptInput/);
  assert.doesNotMatch(tracing, /request\.input/);
  assert.doesNotMatch(tracing, /outputText|completionText|rawOutput/);
  assert.match(otel, /sanitizeLangfuseData/);
  assert.match(otel, /sensitiveKeyPattern/);
  assert.match(otel, /source\|content\|chunk\|embedding\|evidence\|prompt\|completion\|raw\|body/);
  assert.match(docs, /must not receive raw prompts/);
  assert.match(docs, /source content, evidence chunks/);
  assert.match(docs, /Only spans named `radar\.llm\.\*` are exported/);
  assert.doesNotMatch(docs, /trace explorer|prompt playground|model comparison/i);
});

test("RAD-094 covers existing LLM call sites without changing deterministic fixes", async () => {
  const assertions = await readWorkspaceFile("src/lib/assertions/ai-suggestions.ts");
  const testCases = await readWorkspaceFile("src/lib/assertions/ai-test-cases.ts");
  const rubric = await readWorkspaceFile("src/lib/evaluation/hybrid-rubric.ts");
  const promptContracts = await readWorkspaceFile("src/lib/evaluation/llm-prompt-contracts.ts");
  const recommendedFixes = await readWorkspaceFile("src/lib/findings/recommended-fix-generator.ts");

  assert.match(assertions, /provider\.generateJson/);
  assert.match(testCases, /provider\.generateJson/);
  assert.match(rubric, /provider\.generateJson/);
  assert.match(promptContracts, /recommendedFixPromptContract/);
  assert.match(promptContracts, /task: "fix_recommendation"/);
  assert.doesNotMatch(recommendedFixes, /createOpenAIJsonProvider|recommendedFixPromptContract|traceRadarLlmGeneration/);
});

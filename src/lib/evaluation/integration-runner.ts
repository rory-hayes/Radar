import "server-only";

import { createHash } from "node:crypto";

import { z } from "zod";

import type { RadarAssertion, RadarTestCase } from "@/lib/assertions/schema";
import {
  type EvaluationJobOptions,
  type RunNextEvaluationJobInput,
  runNextEvaluationJob,
} from "@/lib/evaluation/job-orchestration";
import {
  approvedRunnableTestCasesForRunner,
  filterManualRerunTestCases,
  readManualRerunRequest,
} from "@/lib/evaluation/manual-reruns";
import {
  assertRunnerTypeMatches,
  sharedRunnerContractMetadata,
  type RunnerEvidenceArtifact,
  type RunnerRetrySemantics,
  type RunnerTerminalStatus,
  type SharedRunnerExecutionResult,
} from "@/lib/evaluation/runner-contract";
import type { TestCaseResultStatus } from "@/lib/evaluation/schema";
import {
  createTestCaseResult,
  getAssertionById,
  listTestCasesForAssertion,
  type JsonRecord,
  type RadarEvaluationRunJob,
  type RadarRepositoryClient,
} from "@/lib/repositories";

export const integrationRunnerVersion = "rad-066";

export const integrationHttpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

const boundedHeaderNameSchema = z.string().trim().min(1).max(120);
const boundedHeaderValueSchema = z.string().trim().max(1_000);
const boundedResponseMatcherSchema = z.string().trim().min(1).max(2_000);

export const integrationCredentialSchema = z.object({
  name: z.string().trim().min(1).max(120),
  value: z.string().min(1).max(10_000),
  redactionLabel: z.string().trim().min(1).max(120).optional(),
});

export const integrationAuthSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("none"),
  }),
  z.object({
    type: z.literal("bearer"),
    credentialName: z.string().trim().min(1).max(120),
  }),
  z.object({
    type: z.literal("api_key_header"),
    headerName: boundedHeaderNameSchema,
    credentialName: z.string().trim().min(1).max(120),
    prefix: z.string().trim().max(40).optional(),
  }),
]);

export const integrationCheckSchema = z.object({
  url: z.string().trim().url().max(2048),
  method: z.enum(integrationHttpMethods).default("GET"),
  headers: z.record(boundedHeaderNameSchema, boundedHeaderValueSchema).default({}),
  auth: integrationAuthSchema.default({ type: "none" }),
  body: z.unknown().optional(),
  acceptableStatuses: z.array(z.number().int().min(100).max(599)).min(1).max(20).optional(),
  expectedStatus: z.number().int().min(100).max(599).optional(),
  responseContains: boundedResponseMatcherSchema.optional(),
  jsonPath: z.string().trim().min(1).max(200).optional(),
  jsonEquals: z.union([z.string().max(1_000), z.number(), z.boolean(), z.null()]).optional(),
  timeoutMs: z.number().int().min(500).max(60_000).default(10_000),
}).refine(
  (check) => check.method !== "GET" || check.body === undefined,
  "GET integration checks cannot include a request body.",
).refine(
  (check) => check.jsonEquals === undefined || Boolean(check.jsonPath),
  "JSON equality checks must include a jsonPath.",
);

export type IntegrationCredentialInput = z.infer<typeof integrationCredentialSchema>;
export type IntegrationCheck = z.infer<typeof integrationCheckSchema>;
export type IntegrationHttpMethod = (typeof integrationHttpMethods)[number];

export type IntegrationHttpRequest = {
  url: string;
  method: IntegrationHttpMethod;
  headers: Record<string, string>;
  body?: string;
  timeoutMs: number;
};

export type IntegrationHttpResponse = {
  status: number;
  headers: Record<string, string>;
  body: string;
  durationMs: number;
};

export type IntegrationRunnerHttpClient = (request: IntegrationHttpRequest) => Promise<IntegrationHttpResponse>;

export type IntegrationRunnerOptions = {
  httpClient?: IntegrationRunnerHttpClient;
  credentials?: readonly IntegrationCredentialInput[];
  now?: () => Date;
};

type IntegrationCaseExecution = {
  result: Awaited<ReturnType<typeof createTestCaseResult>>;
  artifacts: RunnerEvidenceArtifact[];
};

export async function runNextIntegrationEvaluationJob(
  client: RadarRepositoryClient,
  input: RunNextEvaluationJobInput,
  options: EvaluationJobOptions & IntegrationRunnerOptions = {},
) {
  return runNextEvaluationJob(
    client,
    input,
    (context) => runIntegrationEvaluationJob(client, context.run, options),
    options,
  );
}

export async function runIntegrationEvaluationJob(
  client: RadarRepositoryClient,
  run: RadarEvaluationRunJob,
  options: IntegrationRunnerOptions = {},
): Promise<SharedRunnerExecutionResult> {
  const startedAt = options.now?.() ?? new Date();

  if (run.runnerType !== "integration") {
    throw new IntegrationRunnerExecutionError("Integration runner received a non-integration evaluation run.");
  }

  const assertion = await getAssertionById(client, run.workspaceId, run.assertionId);

  if (!assertion) {
    throw new IntegrationRunnerExecutionError("Assertion was not found in this workspace.");
  }

  const retry = retrySemanticsFromRun(run);
  assertRunnerTypeMatches({
    workspaceId: run.workspaceId,
    assertion,
    run,
    triggerType: run.triggerType,
    runnerType: "integration",
    attempt: retry.attempt,
    maxAttempts: retry.maxAttempts,
  });

  const allTestCases = await listTestCasesForAssertion(client, run.workspaceId, assertion.id);
  const approvedIntegrationTestCases = approvedRunnableTestCasesForRunner("integration", allTestCases);
  const manualRerun = readManualRerunRequest(run.executionMetadata);
  const testCases = filterManualRerunTestCases(approvedIntegrationTestCases, manualRerun);

  if (testCases.length === 0) {
    const isTargetedRerun = manualRerun?.scope === "test_case";

    return {
      status: "error",
      totalTestCases: 0,
      passedCount: 0,
      warningCount: 0,
      failedCount: 0,
      errorCount: 1,
      skippedCount: 0,
      evidenceRefs: [],
      artifacts: [],
      executionMetadata: integrationRunnerMetadata({
        ...sharedRunnerContractMetadata({
          runnerType: "integration",
          status: "error",
          evidenceRefCount: 0,
          artifactCount: 0,
          retry,
        }),
        state: "error",
        reason: isTargetedRerun
          ? "manual_rerun_test_case_not_runnable"
          : "no_approved_integration_check_test_cases",
        manualRerun,
      }),
      errorMessage: isTargetedRerun
        ? "The targeted manual rerun test case is no longer approved or runnable."
        : "Integration Runner needs at least one approved integration-check test case.",
    };
  }

  const httpClient = options.httpClient ?? defaultIntegrationHttpClient;
  const executions = await Promise.all(
    testCases.map((testCase) => executeIntegrationTestCase(client, run, assertion, testCase, httpClient, options)),
  );
  const resultRecords = executions.map((execution) => execution.result);
  const artifacts = dedupeRunnerArtifacts(executions.flatMap((execution) => execution.artifacts));
  const resultSummary = summarizeIntegrationResultRecords(resultRecords);
  const completedAt = options.now?.() ?? new Date();

  return {
    status: resultSummary.status,
    totalTestCases: testCases.length,
    passedCount: resultSummary.passedCount,
    warningCount: resultSummary.warningCount,
    failedCount: resultSummary.failedCount,
    errorCount: resultSummary.errorCount,
    skippedCount: resultSummary.skippedCount,
    score: resultSummary.score,
    confidence: resultSummary.confidence,
    evidenceRefs: [],
    artifacts,
    executionMetadata: integrationRunnerMetadata({
      ...sharedRunnerContractMetadata({
        runnerType: "integration",
        status: resultSummary.status,
        evidenceRefCount: 0,
        artifactCount: artifacts.length,
        retry,
      }),
      state: "http_checks_persisted",
      manualRerun,
      testCaseResults: resultRecords.length,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
    }),
  };
}

export function integrationCheckFromTestCase(testCase: RadarTestCase): IntegrationCheck {
  return integrationCheckSchema.parse({
    url: testCase.input.url ?? testCase.input.endpointUrl ?? testCase.input.targetUrl,
    method: testCase.input.method,
    headers: testCase.input.headers,
    auth: testCase.input.auth,
    body: testCase.input.body,
    acceptableStatuses: testCase.input.acceptableStatuses,
    expectedStatus: testCase.input.expectedStatus,
    responseContains: testCase.input.responseContains,
    jsonPath: testCase.input.jsonPath,
    jsonEquals: testCase.input.jsonEquals,
    timeoutMs: testCase.input.timeoutMs,
  });
}

export function buildIntegrationRequest(
  check: IntegrationCheck,
  credentials: readonly IntegrationCredentialInput[] = [],
): IntegrationHttpRequest {
  const headers = applyIntegrationAuthHeaders({ ...check.headers }, check.auth, credentials);
  const body = check.body === undefined ? undefined : JSON.stringify(check.body);

  return {
    url: check.url,
    method: check.method,
    headers: body === undefined ? headers : { "Content-Type": "application/json", ...headers },
    body,
    timeoutMs: check.timeoutMs,
  };
}

export function validateIntegrationResponse(check: IntegrationCheck, response: IntegrationHttpResponse) {
  const acceptableStatuses = check.acceptableStatuses ?? [check.expectedStatus ?? 200];

  if (!acceptableStatuses.includes(response.status)) {
    return {
      status: "failed" as const,
      score: 0,
      confidence: 0.92,
      summary: `Expected HTTP ${acceptableStatuses.join(" or ")} but received ${response.status}.`,
    };
  }

  if (check.responseContains && !response.body.toLocaleLowerCase().includes(check.responseContains.toLocaleLowerCase())) {
    return {
      status: "failed" as const,
      score: 0.35,
      confidence: 0.84,
      summary: "Response status matched, but expected response text was not present.",
    };
  }

  if (check.jsonPath && check.jsonEquals !== undefined) {
    const jsonResult = responseJsonValue(response.body, check.jsonPath);

    if (!jsonResult.ok || jsonResult.value !== check.jsonEquals) {
      return {
        status: "failed" as const,
        score: 0.45,
        confidence: 0.86,
        summary: "Response status matched, but expected JSON state was not present.",
      };
    }
  }

  return {
    status: "passed" as const,
    score: 1,
    confidence: 0.9,
    summary: "Integration check returned the expected HTTP response.",
  };
}

export function redactIntegrationText(
  value: string,
  credentials: readonly IntegrationCredentialInput[] = [],
) {
  const credentialRedacted = credentials.reduce((redacted, credential) => {
    return redacted.split(credential.value).join(credential.redactionLabel ?? `[redacted:${credential.name}]`);
  }, value);

  return credentialRedacted
    .replace(/authorization:\s*bearer\s+[a-z0-9._-]+/gi, "authorization: bearer [redacted-token]")
    .replace(/\b(?:bearer\s+)?[a-z0-9_-]{24,}\b/gi, "[redacted-token]")
    .replace(/https?:\/\/\S+/gi, (url) => safeUrlPreview(url));
}

async function executeIntegrationTestCase(
  client: RadarRepositoryClient,
  run: RadarEvaluationRunJob,
  assertion: RadarAssertion,
  testCase: RadarTestCase,
  httpClient: IntegrationRunnerHttpClient,
  options: IntegrationRunnerOptions,
): Promise<IntegrationCaseExecution> {
  const startedAt = options.now?.() ?? new Date();

  try {
    const check = integrationCheckFromTestCase(testCase);
    const request = buildIntegrationRequest(check, options.credentials);
    const response = await httpClient(request);
    const evaluation = validateIntegrationResponse(check, response);
    const completedAt = options.now?.() ?? new Date();
    const artifact = buildHttpExchangeArtifact({ check, request, response, credentials: options.credentials ?? [] });

    return {
      result: await createTestCaseResult(client, run.workspaceId, {
        evaluationRunId: run.id,
        assertionId: assertion.id,
        testCaseId: testCase.id,
        runnerType: "integration",
        status: evaluation.status,
        score: evaluation.score,
        confidence: evaluation.confidence,
        actualOutput: actualOutputForExchange(check, request, response, evaluation, options.credentials ?? []),
        actualSummary: evaluation.summary,
        evaluatorSummary: evaluation.summary,
        evidenceRefs: [],
        executionMetadata: testCaseExecutionMetadata(check, response, evaluation.status, {
          startedAt: startedAt.toISOString(),
          completedAt: completedAt.toISOString(),
        }),
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs: Math.max(0, completedAt.getTime() - startedAt.getTime()),
      }),
      artifacts: [artifact],
    };
  } catch (error) {
    const completedAt = options.now?.() ?? new Date();

    return {
      result: await createTestCaseResult(client, run.workspaceId, {
        evaluationRunId: run.id,
        assertionId: assertion.id,
        testCaseId: testCase.id,
        runnerType: "integration",
        status: "error",
        actualOutput: actualOutputForError(testCase, error),
        evidenceRefs: [],
        executionMetadata: integrationRunnerMetadata({
          state: "test_case_error",
          status: "error",
          startedAt: startedAt.toISOString(),
          completedAt: completedAt.toISOString(),
        }),
        errorMessage: errorMessage(error),
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs: Math.max(0, completedAt.getTime() - startedAt.getTime()),
      }),
      artifacts: [],
    };
  }
}

async function defaultIntegrationHttpClient(request: IntegrationHttpRequest): Promise<IntegrationHttpResponse> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), request.timeoutMs);

  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      signal: controller.signal,
    });
    const headers = Object.fromEntries(response.headers.entries());
    const body = boundedText(await response.text(), 50_000);

    return {
      status: response.status,
      headers,
      body,
      durationMs: Math.max(0, Date.now() - startedAt),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function applyIntegrationAuthHeaders(
  headers: Record<string, string>,
  auth: IntegrationCheck["auth"],
  credentials: readonly IntegrationCredentialInput[],
) {
  if (auth.type === "none") {
    return headers;
  }

  const credential = credentials.find((item) => item.name === auth.credentialName);

  if (!credential) {
    throw new IntegrationRunnerExecutionError(`Missing runner credential '${auth.credentialName}'.`);
  }

  if (auth.type === "bearer") {
    return {
      ...headers,
      Authorization: `Bearer ${credential.value}`,
    };
  }

  return {
    ...headers,
    [auth.headerName]: `${auth.prefix ?? ""}${credential.value}`,
  };
}

function buildHttpExchangeArtifact(input: {
  check: IntegrationCheck;
  request: IntegrationHttpRequest;
  response: IntegrationHttpResponse;
  credentials: readonly IntegrationCredentialInput[];
}): RunnerEvidenceArtifact {
  return {
    kind: "http_exchange",
    label: "integration-http-exchange",
    redacted: true,
    metadata: {
      runnerVersion: integrationRunnerVersion,
      method: input.request.method,
      urlPreview: safeUrlPreview(input.request.url),
      requestHeaderNames: Object.keys(redactedHeaders(input.request.headers)).sort(),
      responseStatus: input.response.status,
      responseHeaderNames: Object.keys(redactedHeaders(input.response.headers)).sort(),
      contentType: input.response.headers["content-type"],
      responseBodyHash: stableHash(input.response.body),
      responsePreview: boundedText(redactIntegrationText(input.response.body, input.credentials), 500),
      expectedStatus: input.check.expectedStatus,
      acceptableStatuses: input.check.acceptableStatuses,
      responseContains: Boolean(input.check.responseContains),
      jsonPath: input.check.jsonPath,
      jsonEquals: redactJsonValue(input.check.jsonEquals),
    },
  };
}

function actualOutputForExchange(
  check: IntegrationCheck,
  request: IntegrationHttpRequest,
  response: IntegrationHttpResponse,
  evaluation: ReturnType<typeof validateIntegrationResponse>,
  credentials: readonly IntegrationCredentialInput[],
): JsonRecord {
  return {
    runner: "integration",
    runnerVersion: integrationRunnerVersion,
    request: {
      method: request.method,
      urlPreview: safeUrlPreview(request.url),
      headerNames: Object.keys(redactedHeaders(request.headers)).sort(),
      hasBody: Boolean(request.body),
      timeoutMs: request.timeoutMs,
    },
    response: {
      status: response.status,
      durationMs: response.durationMs,
      headerNames: Object.keys(redactedHeaders(response.headers)).sort(),
      bodyHash: stableHash(response.body),
      bodyPreview: boundedText(redactIntegrationText(response.body, credentials), 500),
    },
    expectation: {
      acceptableStatuses: check.acceptableStatuses ?? [check.expectedStatus ?? 200],
      responseContains: Boolean(check.responseContains),
      jsonPath: check.jsonPath,
      jsonEquals: redactJsonValue(check.jsonEquals),
    },
    evaluation,
  };
}

function actualOutputForError(testCase: RadarTestCase, error: unknown): JsonRecord {
  return {
    runner: "integration",
    runnerVersion: integrationRunnerVersion,
    testCaseId: testCase.id,
    error: {
      name: error instanceof Error ? error.name : "IntegrationRunnerExecutionError",
      message: errorMessage(error),
    },
  };
}

function testCaseExecutionMetadata(
  check: IntegrationCheck,
  response: IntegrationHttpResponse,
  status: TestCaseResultStatus,
  input: {
    startedAt: string;
    completedAt: string;
  },
) {
  return integrationRunnerMetadata({
    state: "test_case_http_exchange",
    status,
    method: check.method,
    urlPreview: safeUrlPreview(check.url),
    responseStatus: response.status,
    responseDurationMs: response.durationMs,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
  });
}

function summarizeIntegrationResultRecords(
  results: Awaited<ReturnType<typeof createTestCaseResult>>[],
) {
  const passedCount = results.filter((result) => result.status === "passed").length;
  const warningCount = results.filter((result) => result.status === "warning").length;
  const failedCount = results.filter((result) => result.status === "failed").length;
  const errorCount = results.filter((result) => result.status === "error").length;
  const skippedCount = results.filter((result) => result.status === "skipped").length;
  const totalCount = results.length;

  return {
    status: aggregateIntegrationRunStatus({ totalCount, passedCount, warningCount, failedCount, errorCount, skippedCount }),
    passedCount,
    warningCount,
    failedCount,
    errorCount,
    skippedCount,
    score: averageScore(results.map((result) => result.score)),
    confidence: averageScore(results.map((result) => result.confidence)),
  };
}

function aggregateIntegrationRunStatus(input: {
  totalCount: number;
  passedCount: number;
  warningCount: number;
  failedCount: number;
  errorCount: number;
  skippedCount: number;
}): RunnerTerminalStatus {
  if (input.errorCount >= input.totalCount) {
    return "error";
  }

  if (input.failedCount > 0) {
    return "failed";
  }

  if (input.warningCount > 0 || input.errorCount > 0) {
    return "warning";
  }

  if (input.passedCount === input.totalCount) {
    return "passed";
  }

  return "inconclusive";
}

function dedupeRunnerArtifacts(artifacts: readonly RunnerEvidenceArtifact[]) {
  const seen = new Set<string>();

  return artifacts.filter((artifact) => {
    const key = [artifact.kind, artifact.label, artifact.storagePath, JSON.stringify(artifact.metadata ?? {})].join(":");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function redactedHeaders(headers: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      isSensitiveHeader(key) ? "[redacted-header]" : boundedText(redactIntegrationText(value), 200),
    ]),
  );
}

function responseJsonValue(body: string, path: string): { ok: true; value: unknown } | { ok: false } {
  try {
    const parsed = JSON.parse(body) as unknown;
    const segments = path.replace(/^\$\./, "").replace(/^\$/, "").split(".").filter(Boolean);
    let current = parsed;

    for (const segment of segments) {
      if (!current || typeof current !== "object" || Array.isArray(current)) {
        return { ok: false };
      }

      current = (current as Record<string, unknown>)[segment];
    }

    return { ok: true, value: current };
  } catch {
    return { ok: false };
  }
}

function redactJsonValue(value: IntegrationCheck["jsonEquals"]) {
  return typeof value === "string" ? boundedText(redactIntegrationText(value), 200) : value;
}

function isSensitiveHeader(headerName: string) {
  return /authorization|cookie|api[-_]?key|token|secret/i.test(headerName);
}

function safeUrlPreview(value: string) {
  try {
    const url = new URL(value);
    const query = [...url.searchParams.keys()].sort();
    const suffix = query.length > 0 ? `?${query.map((key) => `${key}=[redacted]`).join("&")}` : "";

    return `${url.origin}${url.pathname}${suffix}`;
  } catch {
    return "[redacted-url]";
  }
}

function retrySemanticsFromRun(run: RadarEvaluationRunJob): RunnerRetrySemantics {
  const orchestration = recordValue(run.executionMetadata.orchestration);
  const attempt = numberValue(orchestration?.attempts) ?? 1;
  const maxAttempts = numberValue(orchestration?.maxAttempts) ?? attempt;

  return {
    attempt,
    maxAttempts,
    retryable: attempt < maxAttempts,
  };
}

function averageScore(values: Array<number | undefined>) {
  const numericValues = values.filter((value): value is number => typeof value === "number");

  if (numericValues.length === 0) {
    return undefined;
  }

  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
}

function integrationRunnerMetadata(metadata: JsonRecord): JsonRecord {
  return {
    ...metadata,
    runner: "integration",
    runnerVersion: integrationRunnerVersion,
  };
}

function stableHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function boundedText(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? boundedText(error.message, 2000) : "Integration Runner execution failed.";
}

export class IntegrationRunnerExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntegrationRunnerExecutionError";
  }
}

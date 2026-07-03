import type { RadarTestCase, RunnerType, TestCaseType } from "@/lib/assertions/schema";

export const manualRerunMetadataVersion = "rad-059";

export type ManualRerunScope = "assertion" | "test_case";

export type ManualRerunRequest = {
  version: typeof manualRerunMetadataVersion;
  scope: ManualRerunScope;
  testCaseId?: string;
  requestedAt: string;
  requestedByUserId: string;
};

type ManualRerunMetadataInput = {
  requestedAt: string;
  requestedByUserId: string;
  testCaseId?: string;
};

const runnerTestCaseTypes: Record<RunnerType, TestCaseType> = {
  knowledge: "customer_question",
  journey: "journey_scenario",
  integration: "integration_check",
};

export function runnerTestCaseType(runnerType: RunnerType) {
  return runnerTestCaseTypes[runnerType];
}

export function approvedRunnableTestCasesForRunner(
  runnerType: RunnerType,
  testCases: readonly RadarTestCase[],
) {
  const expectedType = runnerTestCaseType(runnerType);
  return testCases.filter((testCase) => testCase.status === "approved" && testCase.type === expectedType);
}

export function buildManualRerunMetadata(input: ManualRerunMetadataInput) {
  const scope: ManualRerunScope = input.testCaseId ? "test_case" : "assertion";

  return {
    manualRerun: {
      version: manualRerunMetadataVersion,
      scope,
      ...(input.testCaseId ? { testCaseId: input.testCaseId } : {}),
      requestedAt: input.requestedAt,
      requestedByUserId: input.requestedByUserId,
    },
  };
}

export function readManualRerunRequest(metadata: Record<string, unknown>): ManualRerunRequest | null {
  const value = recordValue(metadata.manualRerun);

  if (!value || value.version !== manualRerunMetadataVersion) {
    return null;
  }

  if (value.scope !== "assertion" && value.scope !== "test_case") {
    return null;
  }

  if (typeof value.requestedAt !== "string" || typeof value.requestedByUserId !== "string") {
    return null;
  }

  if (value.scope === "test_case" && typeof value.testCaseId !== "string") {
    return null;
  }

  return {
    version: manualRerunMetadataVersion,
    scope: value.scope,
    ...(typeof value.testCaseId === "string" ? { testCaseId: value.testCaseId } : {}),
    requestedAt: value.requestedAt,
    requestedByUserId: value.requestedByUserId,
  };
}

export function filterManualRerunTestCases(
  testCases: readonly RadarTestCase[],
  manualRerun: ManualRerunRequest | null,
) {
  if (manualRerun?.scope !== "test_case") {
    return [...testCases];
  }

  return testCases.filter((testCase) => testCase.id === manualRerun.testCaseId);
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

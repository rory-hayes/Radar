import { z } from "zod";

import { runnerTypes, type RunnerType } from "@/lib/assertions/schema";

export const evaluationRunStatuses = [
  "queued",
  "running",
  "passed",
  "warning",
  "failed",
  "inconclusive",
  "error",
  "canceled",
] as const;

export const testCaseResultStatuses = ["passed", "warning", "failed", "inconclusive", "error", "skipped"] as const;

export const evaluationRunTriggerTypes = ["manual", "schedule", "source_change", "system"] as const;

export type EvaluationRunStatus = (typeof evaluationRunStatuses)[number];
export type TestCaseResultStatus = (typeof testCaseResultStatuses)[number];
export type EvaluationRunTriggerType = (typeof evaluationRunTriggerTypes)[number];

export type EvaluationEvidenceRef = {
  sourceId?: string;
  sourceDocumentId?: string;
  sourceChunkId?: string;
  storagePath?: string;
  citation?: string;
  score?: number;
};

export type RadarEvaluationRun = {
  id: string;
  workspaceId: string;
  assertionId: string;
  runnerType: RunnerType;
  status: EvaluationRunStatus;
  triggerType: EvaluationRunTriggerType;
  triggeredByUserId?: string;
  totalTestCases: number;
  score?: number;
  confidence?: number;
};

export type RadarTestCaseResult = {
  id: string;
  workspaceId: string;
  evaluationRunId: string;
  assertionId: string;
  testCaseId: string;
  runnerType: RunnerType;
  status: TestCaseResultStatus;
  score?: number;
  confidence?: number;
  actualOutput: Record<string, unknown>;
  evidenceRefs: EvaluationEvidenceRef[];
};

const scoreSchema = z.number().min(0).max(1);

export const evaluationMetadataSchema = z.record(z.string(), z.unknown()).default({});

export const evaluationEvidenceRefSchema = z.object({
  sourceId: z.uuid().optional(),
  sourceDocumentId: z.uuid().optional(),
  sourceChunkId: z.uuid().optional(),
  storagePath: z.string().trim().max(1024).optional(),
  citation: z.string().trim().max(500).optional(),
  score: scoreSchema.optional(),
});

export const evaluationRunSchema = z.object({
  assertionId: z.uuid(),
  runnerType: z.enum(runnerTypes),
  status: z.enum(evaluationRunStatuses).default("queued"),
  triggerType: z.enum(evaluationRunTriggerTypes).default("manual"),
  triggeredByUserId: z.uuid().optional(),
  scheduledFor: z.iso.datetime().optional(),
  startedAt: z.iso.datetime().optional(),
  completedAt: z.iso.datetime().optional(),
  durationMs: z.number().int().min(0).optional(),
  totalTestCases: z.number().int().min(0).default(0),
  passedCount: z.number().int().min(0).default(0),
  warningCount: z.number().int().min(0).default(0),
  failedCount: z.number().int().min(0).default(0),
  errorCount: z.number().int().min(0).default(0),
  skippedCount: z.number().int().min(0).default(0),
  score: scoreSchema.optional(),
  confidence: scoreSchema.optional(),
  evidenceRefs: z.array(evaluationEvidenceRefSchema).default([]),
  executionMetadata: evaluationMetadataSchema,
  errorMessage: z.string().trim().max(2000).optional(),
});

export const testCaseResultSchema = z.object({
  evaluationRunId: z.uuid(),
  assertionId: z.uuid(),
  testCaseId: z.uuid(),
  runnerType: z.enum(runnerTypes),
  status: z.enum(testCaseResultStatuses).default("inconclusive"),
  score: scoreSchema.optional(),
  confidence: scoreSchema.optional(),
  actualOutput: evaluationMetadataSchema,
  actualSummary: z.string().trim().max(2000).optional(),
  evaluatorSummary: z.string().trim().max(2000).optional(),
  evidenceRefs: z.array(evaluationEvidenceRefSchema).default([]),
  executionMetadata: evaluationMetadataSchema,
  errorMessage: z.string().trim().max(2000).optional(),
  startedAt: z.iso.datetime().optional(),
  completedAt: z.iso.datetime().optional(),
  durationMs: z.number().int().min(0).optional(),
});

export type EvaluationEvidenceRefInput = z.infer<typeof evaluationEvidenceRefSchema>;
export type EvaluationRunInput = z.infer<typeof evaluationRunSchema>;
export type TestCaseResultInput = z.infer<typeof testCaseResultSchema>;

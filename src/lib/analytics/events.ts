import { z } from "zod";

import { assertionCategories, assertionPriorities, runnerTypes } from "@/lib/assertions/schema";
import { evaluationRunStatuses, evaluationRunTriggerTypes } from "@/lib/evaluation/schema";
import { findingSeverities, findingStatuses } from "@/lib/findings/schema";
import { sourceTypes } from "@/lib/sources/schema";

export const productAnalyticsEvents = [
  "source_added",
  "assertion_approved",
  "run_completed",
  "finding_opened",
  "fix_rerun",
  "report_viewed",
] as const;

export type ProductAnalyticsEventName = (typeof productAnalyticsEvents)[number];

const basePropertiesSchema = z.object({
  workspaceId: z.uuid(),
  userId: z.uuid().optional(),
});

export const sourceAddedPropertiesSchema = basePropertiesSchema.extend({
  sourceId: z.uuid(),
  sourceType: z.enum(sourceTypes),
});

export const assertionApprovedPropertiesSchema = basePropertiesSchema.extend({
  assertionId: z.uuid(),
  category: z.enum(assertionCategories),
  priority: z.enum(assertionPriorities),
  runnerType: z.enum(runnerTypes),
  sourceCount: z.number().int().min(0).max(1000),
});

export const runCompletedPropertiesSchema = basePropertiesSchema.omit({ userId: true }).extend({
  assertionId: z.uuid(),
  runId: z.uuid(),
  runnerType: z.enum(runnerTypes),
  status: z.enum(evaluationRunStatuses),
  triggerType: z.enum(evaluationRunTriggerTypes),
  totalTestCases: z.number().int().min(0).max(100000),
  passedCount: z.number().int().min(0).max(100000),
  warningCount: z.number().int().min(0).max(100000),
  failedCount: z.number().int().min(0).max(100000),
  errorCount: z.number().int().min(0).max(100000),
  skippedCount: z.number().int().min(0).max(100000),
  score: z.number().min(0).max(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export const findingOpenedPropertiesSchema = basePropertiesSchema.extend({
  findingId: z.uuid(),
  assertionId: z.uuid(),
  severity: z.enum(findingSeverities),
  status: z.enum(findingStatuses),
});

export const fixRerunPropertiesSchema = basePropertiesSchema.extend({
  findingId: z.uuid(),
  assertionId: z.uuid(),
  runId: z.uuid().optional(),
  targetedTestCase: z.boolean(),
});

export const reportViewedPropertiesSchema = basePropertiesSchema.extend({
  reportId: z.string().trim().min(1).max(200),
  periodStart: z.iso.datetime(),
  periodEnd: z.iso.datetime(),
  activeExceptions: z.number().int().min(0).max(100000),
  passRate: z.number().min(0).max(1),
});

export const productAnalyticsEventSchemas = {
  source_added: sourceAddedPropertiesSchema,
  assertion_approved: assertionApprovedPropertiesSchema,
  run_completed: runCompletedPropertiesSchema,
  finding_opened: findingOpenedPropertiesSchema,
  fix_rerun: fixRerunPropertiesSchema,
  report_viewed: reportViewedPropertiesSchema,
} as const;

export type ProductAnalyticsProperties = {
  [EventName in ProductAnalyticsEventName]: z.infer<(typeof productAnalyticsEventSchemas)[EventName]>;
};

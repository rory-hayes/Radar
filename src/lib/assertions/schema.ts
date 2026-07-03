import { z } from "zod";

import { sourceTypes } from "@/lib/sources/schema";

export const assertionStatuses = ["draft", "active", "paused", "archived"] as const;
export const assertionPriorities = ["critical", "high", "medium", "low"] as const;
export const assertionCategories = [
  "pricing",
  "refund_cancellation",
  "trial_onboarding",
  "billing_invoices",
  "support_escalation",
  "custom",
] as const;
export const runnerTypes = ["knowledge", "journey", "integration"] as const;
export const testCaseStatuses = ["draft", "approved", "disabled", "archived"] as const;
export const testCaseTypes = ["customer_question", "journey_scenario", "integration_check"] as const;
export const assertionScheduleCadences = ["manual", "hourly", "daily", "weekly", "monthly"] as const;

export type AssertionStatus = (typeof assertionStatuses)[number];
export type AssertionPriority = (typeof assertionPriorities)[number];
export type AssertionCategory = (typeof assertionCategories)[number];
export type RunnerType = (typeof runnerTypes)[number];
export type TestCaseStatus = (typeof testCaseStatuses)[number];
export type TestCaseType = (typeof testCaseTypes)[number];
export type AssertionScheduleCadence = (typeof assertionScheduleCadences)[number];

export type RadarAssertion = {
  id: string;
  workspaceId: string;
  title: string;
  purpose: string;
  expectedBehavior: string;
  category: AssertionCategory;
  priority: AssertionPriority;
  runnerType: RunnerType;
  status: AssertionStatus;
  ownerUserId?: string;
  createdBy: string;
};

export type RadarTestCase = {
  id: string;
  workspaceId: string;
  assertionId: string;
  title: string;
  type: TestCaseType;
  status: TestCaseStatus;
  input: Record<string, unknown>;
  expectedResult: string;
  ordinal: number;
};

export const assertionMetadataSchema = z.record(z.string(), z.unknown()).default({});
export const assertionInputSchema = z.record(z.string(), z.unknown()).default({});

export const createAssertionSchema = z.object({
  title: z.string().trim().min(4, "Assertion title must be at least 4 characters.").max(180),
  purpose: z.string().trim().min(8, "Assertion purpose must be at least 8 characters.").max(1000),
  expectedBehavior: z.string().trim().min(8, "Expected behavior must be at least 8 characters.").max(2000),
  category: z.enum(assertionCategories),
  priority: z.enum(assertionPriorities).default("medium"),
  runnerType: z.enum(runnerTypes),
  status: z.enum(assertionStatuses).default("draft"),
  ownerUserId: z.uuid().optional(),
  metadata: assertionMetadataSchema,
});

export const assertionSourceSchema = z.object({
  assertionId: z.uuid(),
  sourceId: z.uuid(),
  isRequired: z.boolean().default(true),
  purpose: z.string().trim().max(500).optional(),
});

export const assertionTemplateSchema = z.object({
  name: z.string().trim().min(4).max(140),
  description: z.string().trim().min(8).max(500),
  category: z.enum(assertionCategories),
  priority: z.enum(assertionPriorities).default("medium"),
  runnerType: z.enum(runnerTypes),
  purposeTemplate: z.string().trim().min(8).max(1000),
  expectedBehaviorTemplate: z.string().trim().min(8).max(2000),
  requiredSourceTypes: z.array(z.enum(sourceTypes)).default([]),
  testCaseBlueprints: z.array(assertionInputSchema).default([]),
  metadata: assertionMetadataSchema,
});

export const assertionRunScheduleSchema = z.object({
  assertionId: z.uuid(),
  cadence: z.enum(assertionScheduleCadences).default("manual"),
  timezone: z.string().trim().min(1).max(80).default("UTC"),
  sourceChangeTrigger: z.boolean().default(true),
  isEnabled: z.boolean().default(false),
  nextRunAt: z.iso.datetime().optional(),
  metadata: assertionMetadataSchema,
});

export const testCaseSchema = z.object({
  assertionId: z.uuid(),
  title: z.string().trim().min(4).max(180),
  type: z.enum(testCaseTypes),
  status: z.enum(testCaseStatuses).default("draft"),
  input: assertionInputSchema,
  expectedResult: z.string().trim().min(8).max(2000),
  ordinal: z.number().int().min(0).default(0),
  metadata: assertionMetadataSchema,
});

export type CreateAssertionInput = z.infer<typeof createAssertionSchema>;
export type AssertionSourceInput = z.infer<typeof assertionSourceSchema>;
export type AssertionTemplateInput = z.infer<typeof assertionTemplateSchema>;
export type AssertionRunScheduleInput = z.infer<typeof assertionRunScheduleSchema>;
export type TestCaseInput = z.infer<typeof testCaseSchema>;

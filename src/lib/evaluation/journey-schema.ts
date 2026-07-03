import { z } from "zod";

export const journeyDefinitionVersion = "rad-063";

export const journeyStepTypes = [
  "visit_url",
  "click",
  "fill_text",
  "assert_text",
  "assert_url",
  "wait",
  "verify_email",
  "screenshot",
  "success_condition",
] as const;

export const journeySuccessConditionTypes = [
  "url_contains",
  "text_visible",
  "email_received",
  "element_visible",
] as const;

const boundedLabelSchema = z.string().trim().min(1).max(140);
const boundedDescriptionSchema = z.string().trim().min(1).max(500);
const boundedSelectorSchema = z.string().trim().min(1).max(500);
const boundedTextSchema = z.string().trim().min(1).max(1000);
const boundedUrlSchema = z.string().trim().url().max(2048);
const stepTimeoutSchema = z.number().int().min(250).max(60_000).optional();

export const journeyLocatorSchema = z.object({
  css: boundedSelectorSchema.optional(),
  text: boundedTextSchema.optional(),
  role: z.string().trim().min(1).max(80).optional(),
  name: z.string().trim().min(1).max(200).optional(),
  testId: z.string().trim().min(1).max(120).optional(),
}).refine(
  (locator) => Boolean(locator.css || locator.text || locator.role || locator.testId),
  "A locator must include css, text, role, or testId.",
);

export const journeyInputValueSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("literal"),
    value: boundedTextSchema,
  }),
  z.object({
    kind: z.literal("credential_ref"),
    name: z.string().trim().min(1).max(120),
  }),
]);

const journeyStepBaseSchema = z.object({
  id: z.string().trim().min(1).max(80),
  label: boundedLabelSchema,
  description: boundedDescriptionSchema.optional(),
  timeoutMs: stepTimeoutSchema,
  required: z.boolean().default(true),
});

export const journeySuccessConditionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("url_contains"),
    value: z.string().trim().min(1).max(500),
  }),
  z.object({
    type: z.literal("text_visible"),
    locator: journeyLocatorSchema,
    text: boundedTextSchema.optional(),
  }),
  z.object({
    type: z.literal("email_received"),
    to: z.string().trim().email().max(320).optional(),
    subjectContains: z.string().trim().min(1).max(300).optional(),
    bodyContains: z.string().trim().min(1).max(1000).optional(),
  }),
  z.object({
    type: z.literal("element_visible"),
    locator: journeyLocatorSchema,
  }),
]);

export const journeyStepDefinitionSchema = z.discriminatedUnion("type", [
  journeyStepBaseSchema.extend({
    type: z.literal("visit_url"),
    url: boundedUrlSchema,
    waitUntil: z.enum(["load", "domcontentloaded", "networkidle"]).default("domcontentloaded"),
  }),
  journeyStepBaseSchema.extend({
    type: z.literal("click"),
    locator: journeyLocatorSchema,
  }),
  journeyStepBaseSchema.extend({
    type: z.literal("fill_text"),
    locator: journeyLocatorSchema,
    value: journeyInputValueSchema,
  }),
  journeyStepBaseSchema.extend({
    type: z.literal("assert_text"),
    locator: journeyLocatorSchema,
    expectedText: boundedTextSchema,
    match: z.enum(["contains", "equals"]).default("contains"),
  }),
  journeyStepBaseSchema.extend({
    type: z.literal("assert_url"),
    expectedUrlContains: z.string().trim().min(1).max(500),
  }),
  journeyStepBaseSchema.extend({
    type: z.literal("wait"),
    durationMs: z.number().int().min(250).max(10_000).optional(),
    locator: journeyLocatorSchema.optional(),
  }).refine(
    (step) => Boolean(step.durationMs || step.locator),
    "A wait step must include durationMs or a locator.",
  ),
  journeyStepBaseSchema.extend({
    type: z.literal("verify_email"),
    to: z.string().trim().email().max(320).optional(),
    subjectContains: z.string().trim().min(1).max(300).optional(),
    bodyContains: z.string().trim().min(1).max(1000).optional(),
  }),
  journeyStepBaseSchema.extend({
    type: z.literal("screenshot"),
    artifactLabel: z.string().trim().min(1).max(120),
  }),
  journeyStepBaseSchema.extend({
    type: z.literal("success_condition"),
    condition: journeySuccessConditionSchema,
  }),
]);

export const journeyDefinitionSchema = z.object({
  version: z.literal(journeyDefinitionVersion).default(journeyDefinitionVersion),
  name: boundedLabelSchema,
  startUrl: boundedUrlSchema.optional(),
  steps: z.array(journeyStepDefinitionSchema).min(1).max(50),
  successConditions: z.array(journeySuccessConditionSchema).max(10).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
}).superRefine((definition, context) => {
  const stepIds = new Set<string>();

  definition.steps.forEach((step, index) => {
    if (stepIds.has(step.id)) {
      context.addIssue({
        code: "custom",
        path: ["steps", index, "id"],
        message: "Journey step ids must be unique.",
      });
    }

    stepIds.add(step.id);
  });
});

export type JourneyLocator = z.infer<typeof journeyLocatorSchema>;
export type JourneyInputValue = z.infer<typeof journeyInputValueSchema>;
export type JourneySuccessCondition = z.infer<typeof journeySuccessConditionSchema>;
export type JourneyStepDefinition = z.infer<typeof journeyStepDefinitionSchema>;
export type JourneyDefinition = z.infer<typeof journeyDefinitionSchema>;

export function parseJourneyDefinition(input: unknown): JourneyDefinition {
  return journeyDefinitionSchema.parse(input);
}

export function safeJourneyStepSummary(step: JourneyStepDefinition) {
  if (step.type === "fill_text" && step.value.kind === "credential_ref") {
    return `${step.label} uses credential ${step.value.name}.`;
  }

  return `${step.label} (${step.type}).`;
}

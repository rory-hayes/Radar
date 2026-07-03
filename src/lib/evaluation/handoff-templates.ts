import "server-only";

import { z } from "zod";

import {
  createGenericIntegrationTestCaseBlueprint,
  genericIntegrationCheckDefinitionSchema,
  type GenericIntegrationCheckDefinition,
} from "@/lib/evaluation/integration-checks";
import { integrationAuthSchema } from "@/lib/evaluation/integration-runner";

export const minimalHandoffTemplateVersion = "rad-068";

export const minimalHandoffTemplateSlugs = [
  "email-sent",
  "support-ticket-created",
  "crm-task-created",
  "webhook-event-received",
  "billing-status-changed",
] as const;

const boundedUrlSchema = z.string().trim().url().max(2048);
const boundedTextSchema = z.string().trim().min(1).max(1_000);
const boundedHeadersSchema = z.record(z.string().trim().min(1).max(120), z.string().trim().max(1_000)).default({});
const jsonComparableSchema = z.union([z.string().max(1_000), z.number(), z.boolean(), z.null()]);

export const minimalHandoffTemplateInputSchema = z.object({
  url: boundedUrlSchema,
  title: z.string().trim().min(4).max(180).optional(),
  headers: boundedHeadersSchema,
  auth: integrationAuthSchema.default({ type: "none" }),
  timeoutMs: z.number().int().min(500).max(60_000).default(10_000),
  expectedStatus: z.number().int().min(100).max(599).optional(),
  acceptableStatuses: z.array(z.number().int().min(100).max(599)).min(1).max(20).optional(),
  responseContains: boundedTextSchema.optional(),
  jsonPath: z.string().trim().min(1).max(200).optional(),
  jsonEquals: jsonComparableSchema.optional(),
  body: z.unknown().optional(),
});

export type MinimalHandoffTemplateSlug = (typeof minimalHandoffTemplateSlugs)[number];
export type MinimalHandoffTemplateInput = z.input<typeof minimalHandoffTemplateInputSchema>;

export type MinimalHandoffTemplate = {
  slug: MinimalHandoffTemplateSlug;
  name: string;
  description: string;
  defaultExpectedResult: string;
  requiredConfiguration: readonly string[];
};

export const minimalHandoffTemplates = [
  {
    slug: "email-sent",
    name: "Email Sent",
    description: "Verify that an email evidence endpoint reports the expected sent email.",
    defaultExpectedResult: "The email evidence endpoint confirms the expected customer email was sent.",
    requiredConfiguration: ["url", "jsonPath", "jsonEquals"],
  },
  {
    slug: "support-ticket-created",
    name: "Support Ticket Created",
    description: "Verify that a support handoff endpoint accepts or reports a created ticket.",
    defaultExpectedResult: "The support endpoint accepts the request or reports the expected ticket state.",
    requiredConfiguration: ["url"],
  },
  {
    slug: "crm-task-created",
    name: "CRM Task Created",
    description: "Verify that a CRM evidence endpoint reports the expected task state.",
    defaultExpectedResult: "The CRM evidence endpoint returns the expected created task state.",
    requiredConfiguration: ["url", "jsonPath", "jsonEquals"],
  },
  {
    slug: "webhook-event-received",
    name: "Webhook Event Received",
    description: "Verify that a webhook evidence endpoint reports the expected event receipt.",
    defaultExpectedResult: "The webhook evidence endpoint confirms the expected event was received.",
    requiredConfiguration: ["url"],
  },
  {
    slug: "billing-status-changed",
    name: "Billing Status Changed",
    description: "Verify that a billing evidence endpoint returns the expected object status.",
    defaultExpectedResult: "The billing evidence endpoint returns the expected updated billing status.",
    requiredConfiguration: ["url", "jsonPath", "jsonEquals"],
  },
] as const satisfies readonly MinimalHandoffTemplate[];

export function createMinimalHandoffDefinition(
  slug: MinimalHandoffTemplateSlug,
  input: MinimalHandoffTemplateInput,
): GenericIntegrationCheckDefinition {
  const parsedInput = minimalHandoffTemplateInputSchema.parse(input);
  const base = {
    title: parsedInput.title ?? handoffTemplateBySlug(slug).name,
    url: parsedInput.url,
    headers: parsedInput.headers,
    auth: parsedInput.auth,
    timeoutMs: parsedInput.timeoutMs,
    expectedStatus: parsedInput.expectedStatus,
    acceptableStatuses: parsedInput.acceptableStatuses,
    responseContains: parsedInput.responseContains,
  };

  switch (slug) {
    case "email-sent":
      return genericIntegrationCheckDefinitionSchema.parse({
        ...base,
        kind: "api_expected_state",
        jsonPath: parsedInput.jsonPath ?? "$.email.sent",
        jsonEquals: parsedInput.jsonEquals ?? true,
      });
    case "support-ticket-created":
      return genericIntegrationCheckDefinitionSchema.parse({
        ...base,
        kind: "ticket_endpoint_accepted",
        body: parsedInput.body ?? {},
        expectedStatus: parsedInput.expectedStatus ?? 202,
      });
    case "crm-task-created":
      return genericIntegrationCheckDefinitionSchema.parse({
        ...base,
        kind: "api_expected_state",
        jsonPath: parsedInput.jsonPath ?? "$.task.status",
        jsonEquals: parsedInput.jsonEquals ?? "created",
      });
    case "webhook-event-received":
      return genericIntegrationCheckDefinitionSchema.parse({
        ...base,
        kind: "webhook_fired",
      });
    case "billing-status-changed":
      return genericIntegrationCheckDefinitionSchema.parse({
        ...base,
        kind: "billing_object_updated",
        jsonPath: parsedInput.jsonPath ?? "$.billing.status",
        jsonEquals: parsedInput.jsonEquals ?? "updated",
      });
  }
}

export function createMinimalHandoffTestCaseBlueprint(
  slug: MinimalHandoffTemplateSlug,
  input: MinimalHandoffTemplateInput,
) {
  const definition = createMinimalHandoffDefinition(slug, input);
  const template = handoffTemplateBySlug(slug);

  return {
    ...createGenericIntegrationTestCaseBlueprint(definition),
    expectedResult: template.defaultExpectedResult,
    metadata: {
      minimalHandoffTemplate: {
        version: minimalHandoffTemplateVersion,
        slug,
        genericKind: definition.kind,
      },
    },
  };
}

export function handoffTemplateBySlug(slug: MinimalHandoffTemplateSlug) {
  const template = minimalHandoffTemplates.find((item) => item.slug === slug);

  if (!template) {
    throw new MinimalHandoffTemplateError(`Unknown handoff template '${slug}'.`);
  }

  return template;
}

export class MinimalHandoffTemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MinimalHandoffTemplateError";
  }
}

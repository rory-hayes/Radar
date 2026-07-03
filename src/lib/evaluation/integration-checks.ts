import "server-only";

import { z } from "zod";

import {
  integrationAuthSchema,
  integrationCheckSchema,
  integrationHttpMethods,
  type IntegrationCheck,
} from "@/lib/evaluation/integration-runner";

export const genericIntegrationCheckVersion = "rad-067";

export const genericIntegrationCheckKinds = [
  "webhook_fired",
  "api_expected_state",
  "ticket_endpoint_accepted",
  "billing_object_updated",
] as const;

const boundedTitleSchema = z.string().trim().min(4).max(180);
const boundedTextSchema = z.string().trim().min(1).max(1_000);
const boundedUrlSchema = z.string().trim().url().max(2048);
const boundedHeadersSchema = z.record(z.string().trim().min(1).max(120), z.string().trim().max(1_000)).default({});
const jsonComparableSchema = z.union([z.string().max(1_000), z.number(), z.boolean(), z.null()]);

const genericCheckBaseSchema = z.object({
  title: boundedTitleSchema.optional(),
  url: boundedUrlSchema,
  headers: boundedHeadersSchema,
  auth: integrationAuthSchema.default({ type: "none" }),
  timeoutMs: z.number().int().min(500).max(60_000).default(10_000),
  acceptableStatuses: z.array(z.number().int().min(100).max(599)).min(1).max(20).optional(),
});

export const genericIntegrationCheckDefinitionSchema = z.discriminatedUnion("kind", [
  genericCheckBaseSchema.extend({
    kind: z.literal("webhook_fired"),
    method: z.enum(integrationHttpMethods).default("GET"),
    expectedStatus: z.number().int().min(100).max(599).default(200),
    responseContains: boundedTextSchema.optional(),
  }),
  genericCheckBaseSchema.extend({
    kind: z.literal("api_expected_state"),
    method: z.enum(integrationHttpMethods).default("GET"),
    expectedStatus: z.number().int().min(100).max(599).default(200),
    responseContains: boundedTextSchema.optional(),
    jsonPath: z.string().trim().min(1).max(200),
    jsonEquals: jsonComparableSchema,
  }),
  genericCheckBaseSchema.extend({
    kind: z.literal("ticket_endpoint_accepted"),
    method: z.enum(["POST", "PUT", "PATCH"]).default("POST"),
    body: z.unknown().default({}),
    expectedStatus: z.number().int().min(100).max(599).default(202),
    responseContains: boundedTextSchema.optional(),
  }),
  genericCheckBaseSchema.extend({
    kind: z.literal("billing_object_updated"),
    method: z.enum(integrationHttpMethods).default("GET"),
    expectedStatus: z.number().int().min(100).max(599).default(200),
    responseContains: boundedTextSchema.optional(),
    jsonPath: z.string().trim().min(1).max(200),
    jsonEquals: jsonComparableSchema,
  }),
]);

export type GenericIntegrationCheckKind = (typeof genericIntegrationCheckKinds)[number];
export type GenericIntegrationCheckDefinition = z.infer<typeof genericIntegrationCheckDefinitionSchema>;

export type GenericIntegrationCheckTemplate = {
  kind: GenericIntegrationCheckKind;
  name: string;
  description: string;
  defaultExpectedResult: string;
};

export const genericIntegrationCheckTemplates = [
  {
    kind: "webhook_fired",
    name: "Webhook Fired",
    description: "Verify that a downstream webhook/event endpoint reports the expected event.",
    defaultExpectedResult: "The webhook evidence endpoint confirms the expected event was received.",
  },
  {
    kind: "api_expected_state",
    name: "API Expected State",
    description: "Verify that an API endpoint returns the expected customer-facing state.",
    defaultExpectedResult: "The API response returns the expected status and JSON state.",
  },
  {
    kind: "ticket_endpoint_accepted",
    name: "Ticket Endpoint Accepted",
    description: "Verify that a support or operations handoff endpoint accepts the expected request.",
    defaultExpectedResult: "The handoff endpoint accepts the request without leaking sensitive data.",
  },
  {
    kind: "billing_object_updated",
    name: "Billing Object Updated",
    description: "Verify that a billing object exposes the expected updated state.",
    defaultExpectedResult: "The billing object endpoint returns the expected updated billing state.",
  },
] as const satisfies readonly GenericIntegrationCheckTemplate[];

export function createGenericIntegrationCheckInput(
  definition: GenericIntegrationCheckDefinition,
): IntegrationCheck {
  const parsedDefinition = genericIntegrationCheckDefinitionSchema.parse(definition);

  switch (parsedDefinition.kind) {
    case "webhook_fired":
      return integrationCheckSchema.parse({
        url: parsedDefinition.url,
        method: parsedDefinition.method,
        headers: parsedDefinition.headers,
        auth: parsedDefinition.auth,
        expectedStatus: parsedDefinition.expectedStatus,
        acceptableStatuses: parsedDefinition.acceptableStatuses,
        responseContains: parsedDefinition.responseContains,
        timeoutMs: parsedDefinition.timeoutMs,
      });
    case "api_expected_state":
    case "billing_object_updated":
      return integrationCheckSchema.parse({
        url: parsedDefinition.url,
        method: parsedDefinition.method,
        headers: parsedDefinition.headers,
        auth: parsedDefinition.auth,
        expectedStatus: parsedDefinition.expectedStatus,
        acceptableStatuses: parsedDefinition.acceptableStatuses,
        responseContains: parsedDefinition.responseContains,
        jsonPath: parsedDefinition.jsonPath,
        jsonEquals: parsedDefinition.jsonEquals,
        timeoutMs: parsedDefinition.timeoutMs,
      });
    case "ticket_endpoint_accepted":
      return integrationCheckSchema.parse({
        url: parsedDefinition.url,
        method: parsedDefinition.method,
        headers: parsedDefinition.headers,
        auth: parsedDefinition.auth,
        body: parsedDefinition.body,
        expectedStatus: parsedDefinition.expectedStatus,
        acceptableStatuses: parsedDefinition.acceptableStatuses,
        responseContains: parsedDefinition.responseContains,
        timeoutMs: parsedDefinition.timeoutMs,
      });
  }
}

export function createGenericIntegrationTestCaseBlueprint(
  definition: GenericIntegrationCheckDefinition,
) {
  const parsedDefinition = genericIntegrationCheckDefinitionSchema.parse(definition);
  const template = genericIntegrationCheckTemplates.find((item) => item.kind === parsedDefinition.kind);

  return {
    title: parsedDefinition.title ?? template?.name ?? "Integration check",
    type: "integration_check" as const,
    input: createGenericIntegrationCheckInput(parsedDefinition),
    expectedResult: template?.defaultExpectedResult ?? "The integration check returns the expected state.",
    metadata: {
      genericIntegrationCheck: {
        version: genericIntegrationCheckVersion,
        kind: parsedDefinition.kind,
      },
    },
  };
}

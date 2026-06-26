import { z } from "zod";

export const captureConfigSchema = z
  .object({
    microphone: z.boolean().optional(),
    activeTab: z.boolean().optional(),
  })
  .optional()
  .transform((capture) => ({
    microphone: capture?.microphone ?? false,
    activeTab: capture?.activeTab ?? true,
  }));

export const tabContextSchema = z
  .object({
    url: z.string().trim().max(2048).optional(),
    title: z.string().trim().max(300).optional(),
    favIconUrl: z.string().trim().max(2048).optional(),
  })
  .optional();

export const preflightRequestSchema = z.object({
  workspaceId: z.string().trim().min(1).max(120).optional(),
  tab: tabContextSchema,
  capture: captureConfigSchema,
  client: z
    .object({
      extensionVersion: z.string().trim().max(80).optional(),
      timezone: z.string().trim().max(80).optional(),
    })
    .optional(),
});

export const createSessionRequestSchema = preflightRequestSchema.extend({
  consent: z.object({
    confirmed: z.literal(true),
    capturedAt: z.string().datetime().optional(),
    policyVersion: z.string().trim().max(80).optional(),
  }),
});

export const clientSecretRequestSchema = z
  .object({
    expiresAfterSeconds: z.number().int().min(60).max(900).optional(),
  })
  .optional()
  .default({});

export const segmentRequestSchema = z.object({
  text: z.string().trim().min(1).max(20_000),
  source: z.enum(["microphone", "active_tab", "manual"]).optional().default("manual"),
  isFinal: z.boolean().optional().default(true),
  startedAtMs: z.number().nonnegative().optional(),
  endedAtMs: z.number().nonnegative().optional(),
  localTest: z
    .object({
      enabled: z.literal(true),
      reason: z.string().trim().min(1).max(200).optional(),
    })
    .optional(),
});

export const feedbackRequestSchema = z.object({
  sessionId: z.string().uuid(),
  rating: z.enum(["helpful", "not_helpful", "incorrect", "unsafe"]),
  note: z.string().trim().max(1000).optional(),
});

export const endSessionRequestSchema = z
  .object({
    reason: z.enum(["user_ended", "tab_closed", "error"]).optional().default("user_ended"),
  })
  .optional()
  .default({});

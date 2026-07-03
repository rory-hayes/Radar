import { z } from "zod";

import {
  assertionCategories,
  assertionPriorities,
  assertionRunScheduleSchema,
  assertionScheduleCadences,
  assertionSourceSchema,
  assertionSourceRelationshipTypes,
  assertionStatuses,
  createAssertionSchema,
  runnerTypes,
  testCaseSchema,
  testCaseStatuses,
  testCaseTypes,
} from "@/lib/assertions/schema";
import {
  evaluationEvidenceRefSchema,
  evaluationRunSchema,
  evaluationRunStatuses,
  evaluationRunTriggerTypes,
  testCaseResultStatuses,
  testCaseResultSchema,
} from "@/lib/evaluation/schema";
import {
  findingActivitySchema,
  findingActivityTypes,
  findingAssignmentSchema,
  findingEvidenceSchema,
  findingEvidenceTypes,
  findingSchema,
  findingSeverities,
  findingStatuses,
} from "@/lib/findings/schema";
import {
  createSourceSchema,
  sourceChunkSchema,
  sourceDocumentSchema,
  sourceDocumentStatuses,
  sourceSyncStatuses,
  sourceTypes,
  sourceVersionSchema,
} from "@/lib/sources/schema";
import {
  createWorkspaceSchema,
  updateWorkspaceSettingsSchema,
  workspaceMemberStatuses,
  workspaceRoles,
  workspaceStatuses,
  workspaceTeamVisibilities,
} from "@/lib/workspaces/schema";

export const radarIdSchema = z.uuid();
export const radarIsoDateTimeSchema = z.iso.datetime();
export const radarJsonRecordSchema = z.record(z.string(), z.unknown()).default({});
export const evidenceArtifactKinds = [
  "uploaded-document",
  "source-snapshot",
  "screenshot",
  "run-artifact",
  "email-receipt",
  "report-export",
] as const;

export const workspaceIdRequestSchema = z.object({
  workspaceId: radarIdSchema,
});

export const entityIdRequestSchema = z.object({
  id: radarIdSchema,
});

export const workspaceCreateRequestSchema = createWorkspaceSchema;
export const workspaceUpdateSettingsRequestSchema = updateWorkspaceSettingsSchema;

export const workspaceResponseSchema = z.object({
  id: radarIdSchema,
  name: z.string().min(1),
  slug: z.string().min(1),
  status: z.enum(workspaceStatuses),
  teamVisibility: z.enum(workspaceTeamVisibilities),
});

export const workspaceMembershipResponseSchema = z.object({
  workspace: workspaceResponseSchema,
  role: z.enum(workspaceRoles),
  memberStatus: z.enum(workspaceMemberStatuses),
});

export const sourceCreateRequestSchema = createSourceSchema;
export const sourceUpdateRequestSchema = createSourceSchema.partial();
export const sourceVersionCreateRequestSchema = sourceVersionSchema;
export const sourceDocumentCreateRequestSchema = sourceDocumentSchema;
export const sourceChunkCreateRequestSchema = sourceChunkSchema;

export const sourceResponseSchema = z.object({
  id: radarIdSchema,
  workspaceId: radarIdSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(sourceTypes),
  syncStatus: z.enum(sourceSyncStatuses),
  originUri: z.string().optional(),
  contentHash: z.string().optional(),
  lastSyncedAt: radarIsoDateTimeSchema.optional(),
  lastSyncError: z.string().optional(),
  createdBy: radarIdSchema,
});

export const sourceVersionResponseSchema = z.object({
  id: radarIdSchema,
  workspaceId: radarIdSchema,
  sourceId: radarIdSchema,
  versionNumber: z.number().int().positive(),
  syncStatus: z.enum(sourceSyncStatuses),
  contentHash: z.string().min(1),
  documentCount: z.number().int().min(0),
  chunkCount: z.number().int().min(0),
});

export const sourceDocumentResponseSchema = z.object({
  id: radarIdSchema,
  workspaceId: radarIdSchema,
  sourceId: radarIdSchema,
  sourceVersionId: radarIdSchema,
  title: z.string().min(1),
  documentUri: z.string().optional(),
  mimeType: z.string().optional(),
  storagePath: z.string().optional(),
  status: z.enum(sourceDocumentStatuses),
  contentHash: z.string().min(1),
  byteSize: z.number().int().min(0).optional(),
});

export const sourceChunkResponseSchema = z.object({
  id: radarIdSchema,
  workspaceId: radarIdSchema,
  sourceId: radarIdSchema,
  sourceDocumentId: radarIdSchema,
  chunkIndex: z.number().int().min(0),
  content: z.string().min(1),
  contentHash: z.string().min(1),
  tokenCount: z.number().int().positive().optional(),
});

export const assertionCreateRequestSchema = createAssertionSchema;
export const assertionUpdateRequestSchema = createAssertionSchema.partial();
export const assertionSourceLinkRequestSchema = assertionSourceSchema;
export const assertionScheduleUpsertRequestSchema = assertionRunScheduleSchema;
export const testCaseCreateRequestSchema = testCaseSchema;
export const testCaseUpdateRequestSchema = testCaseSchema.partial();

export const assertionResponseSchema = z.object({
  id: radarIdSchema,
  workspaceId: radarIdSchema,
  title: z.string().min(1),
  purpose: z.string().min(1),
  expectedBehavior: z.string().min(1),
  category: z.enum(assertionCategories),
  priority: z.enum(assertionPriorities),
  runnerType: z.enum(runnerTypes),
  status: z.enum(assertionStatuses),
  ownerUserId: radarIdSchema.optional(),
  createdBy: radarIdSchema,
});

export const assertionSourceResponseSchema = z.object({
  workspaceId: radarIdSchema,
  assertionId: radarIdSchema,
  sourceId: radarIdSchema,
  isRequired: z.boolean(),
  relationshipType: z.enum(assertionSourceRelationshipTypes),
  purpose: z.string().optional(),
});

export const assertionRunScheduleResponseSchema = z.object({
  id: radarIdSchema,
  workspaceId: radarIdSchema,
  assertionId: radarIdSchema,
  cadence: z.enum(assertionScheduleCadences),
  timezone: z.string().min(1),
  sourceChangeTrigger: z.boolean(),
  isEnabled: z.boolean(),
  nextRunAt: radarIsoDateTimeSchema.optional(),
  metadata: radarJsonRecordSchema,
});

export const testCaseResponseSchema = z.object({
  id: radarIdSchema,
  workspaceId: radarIdSchema,
  assertionId: radarIdSchema,
  title: z.string().min(1),
  type: z.enum(testCaseTypes),
  status: z.enum(testCaseStatuses),
  input: radarJsonRecordSchema,
  expectedResult: z.string().min(1),
  ordinal: z.number().int().min(0),
});

export const evaluationRunCreateRequestSchema = evaluationRunSchema;
export const evaluationRunStatusUpdateRequestSchema = z.object({
  evaluationRunId: radarIdSchema,
  status: z.enum(evaluationRunStatuses),
});
export const testCaseResultCreateRequestSchema = testCaseResultSchema;

export const evaluationEvidenceRefResponseSchema = evaluationEvidenceRefSchema;

export const evaluationRunResponseSchema = z.object({
  id: radarIdSchema,
  workspaceId: radarIdSchema,
  assertionId: radarIdSchema,
  runnerType: z.enum(runnerTypes),
  status: z.enum(evaluationRunStatuses),
  triggerType: z.enum(evaluationRunTriggerTypes),
  triggeredByUserId: radarIdSchema.optional(),
  totalTestCases: z.number().int().min(0),
  score: z.number().min(0).max(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export const testCaseResultResponseSchema = z.object({
  id: radarIdSchema,
  workspaceId: radarIdSchema,
  evaluationRunId: radarIdSchema,
  assertionId: radarIdSchema,
  testCaseId: radarIdSchema,
  runnerType: z.enum(runnerTypes),
  status: z.enum(testCaseResultStatuses),
  score: z.number().min(0).max(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
  actualOutput: radarJsonRecordSchema,
  evidenceRefs: z.array(evaluationEvidenceRefResponseSchema),
});

export const findingCreateRequestSchema = findingSchema;
export const findingStatusUpdateRequestSchema = z.object({
  findingId: radarIdSchema,
  status: z.enum(findingStatuses),
});
export const findingEvidenceCreateRequestSchema = findingEvidenceSchema;
export const findingAssignmentCreateRequestSchema = findingAssignmentSchema;
export const findingActivityCreateRequestSchema = findingActivitySchema;

export const findingResponseSchema = z.object({
  id: radarIdSchema,
  workspaceId: radarIdSchema,
  assertionId: radarIdSchema,
  evaluationRunId: radarIdSchema.optional(),
  testCaseResultId: radarIdSchema.optional(),
  title: z.string().min(1),
  summary: z.string().min(1),
  expected: z.string().min(1),
  actual: z.string().min(1),
  severity: z.enum(findingSeverities),
  status: z.enum(findingStatuses),
  confidence: z.number().min(0).max(1),
  customerImpact: z.string().min(1),
  recommendedFix: z.string().min(1),
  ownerUserId: radarIdSchema.optional(),
  dedupeKey: z.string().min(1),
  metadata: radarJsonRecordSchema.optional(),
});

export const findingEvidenceResponseSchema = z.object({
  id: radarIdSchema,
  workspaceId: radarIdSchema,
  findingId: radarIdSchema,
  evidenceType: z.enum(findingEvidenceTypes),
  sourceId: radarIdSchema.optional(),
  sourceDocumentId: radarIdSchema.optional(),
  sourceChunkId: radarIdSchema.optional(),
  evaluationRunId: radarIdSchema.optional(),
  testCaseResultId: radarIdSchema.optional(),
  quote: z.string().optional(),
  artifactPath: z.string().optional(),
  citation: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export const findingAssignmentResponseSchema = z.object({
  id: radarIdSchema,
  workspaceId: radarIdSchema,
  findingId: radarIdSchema,
  assigneeUserId: radarIdSchema,
  assignedByUserId: radarIdSchema.optional(),
  note: z.string().optional(),
  assignedAt: radarIsoDateTimeSchema,
  unassignedAt: radarIsoDateTimeSchema.optional(),
});

export const findingActivityResponseSchema = z.object({
  id: radarIdSchema,
  workspaceId: radarIdSchema,
  findingId: radarIdSchema,
  actorUserId: radarIdSchema.optional(),
  activityType: z.enum(findingActivityTypes),
  fromStatus: z.enum(findingStatuses).optional(),
  toStatus: z.enum(findingStatuses).optional(),
  note: z.string().optional(),
  createdAt: radarIsoDateTimeSchema,
});

export const evidenceArtifactPathRequestSchema = z.object({
  workspaceId: radarIdSchema,
  artifactKind: z.enum(evidenceArtifactKinds),
  ownerId: radarIdSchema,
  fileName: z
    .string()
    .trim()
    .min(1)
    .max(180)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "Use a simple file name without spaces or path separators."),
});

export const evidenceArtifactSignedUrlRequestSchema = z.object({
  workspaceId: radarIdSchema,
  storagePath: z.string().trim().min(1).max(1024),
  expiresInSeconds: z.number().int().min(60).max(3600).default(300),
});

export const evidenceArtifactUploadUrlResponseSchema = z.object({
  bucket: z.literal("radar-evidence-artifacts"),
  storagePath: z.string().min(1).max(1024),
  signedUrl: z.string().url(),
  token: z.string().min(1).optional(),
});

export const evidenceArtifactDownloadUrlResponseSchema = z.object({
  bucket: z.literal("radar-evidence-artifacts"),
  storagePath: z.string().min(1).max(1024),
  signedUrl: z.string().url(),
  expiresInSeconds: z.number().int().min(60).max(3600),
});

export const validationSuccessResponseSchema = <TSchema extends z.ZodType>(dataSchema: TSchema) =>
  z.object({
    ok: z.literal(true),
    data: dataSchema,
  });

export const validationErrorResponseSchema = z.object({
  ok: z.literal(false),
  code: z.enum(["unauthenticated", "workspace_required", "unauthorized", "validation", "server_error"]),
  error: z.string().min(1),
});

export const validationListResponseSchema = <TSchema extends z.ZodType>(itemSchema: TSchema) =>
  validationSuccessResponseSchema(z.array(itemSchema));

export type WorkspaceCreateRequest = z.infer<typeof workspaceCreateRequestSchema>;
export type WorkspaceUpdateSettingsRequest = z.infer<typeof workspaceUpdateSettingsRequestSchema>;
export type SourceCreateRequest = z.infer<typeof sourceCreateRequestSchema>;
export type SourceUpdateRequest = z.infer<typeof sourceUpdateRequestSchema>;
export type AssertionCreateRequest = z.infer<typeof assertionCreateRequestSchema>;
export type AssertionUpdateRequest = z.infer<typeof assertionUpdateRequestSchema>;
export type TestCaseCreateRequest = z.infer<typeof testCaseCreateRequestSchema>;
export type TestCaseUpdateRequest = z.infer<typeof testCaseUpdateRequestSchema>;
export type EvaluationRunCreateRequest = z.infer<typeof evaluationRunCreateRequestSchema>;
export type TestCaseResultCreateRequest = z.infer<typeof testCaseResultCreateRequestSchema>;
export type FindingCreateRequest = z.infer<typeof findingCreateRequestSchema>;
export type EvidenceArtifactKind = (typeof evidenceArtifactKinds)[number];
export type EvidenceArtifactPathRequest = z.infer<typeof evidenceArtifactPathRequestSchema>;
export type EvidenceArtifactSignedUrlRequest = z.infer<typeof evidenceArtifactSignedUrlRequestSchema>;

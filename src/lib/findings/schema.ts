import { z } from "zod";

export const findingStatuses = ["open", "investigating", "fixed", "resolved", "ignored", "false_positive"] as const;
export const findingSeverities = ["critical", "high", "medium", "low"] as const;
export const findingEvidenceTypes = ["source_chunk", "source_document", "run_output", "artifact", "manual_note"] as const;
export const findingActivityTypes = [
  "created",
  "status_changed",
  "assigned",
  "unassigned",
  "commented",
  "evidence_added",
  "rerun_linked",
  "resolved",
] as const;

export type FindingStatus = (typeof findingStatuses)[number];
export type FindingSeverity = (typeof findingSeverities)[number];
export type FindingEvidenceType = (typeof findingEvidenceTypes)[number];
export type FindingActivityType = (typeof findingActivityTypes)[number];

export type RadarFinding = {
  id: string;
  workspaceId: string;
  assertionId: string;
  evaluationRunId?: string;
  testCaseResultId?: string;
  title: string;
  summary: string;
  expected: string;
  actual: string;
  severity: FindingSeverity;
  status: FindingStatus;
  confidence: number;
  customerImpact: string;
  recommendedFix: string;
  ownerUserId?: string;
  dedupeKey: string;
};

export type RadarFindingEvidence = {
  id: string;
  workspaceId: string;
  findingId: string;
  evidenceType: FindingEvidenceType;
  sourceId?: string;
  sourceDocumentId?: string;
  sourceChunkId?: string;
  evaluationRunId?: string;
  testCaseResultId?: string;
  quote?: string;
  artifactPath?: string;
  citation?: string;
  confidence?: number;
};

const confidenceSchema = z.number().min(0).max(1);
export const findingMetadataSchema = z.record(z.string(), z.unknown()).default({});

export const findingSchema = z.object({
  assertionId: z.uuid(),
  evaluationRunId: z.uuid().optional(),
  testCaseResultId: z.uuid().optional(),
  title: z.string().trim().min(4).max(180),
  summary: z.string().trim().min(8).max(2000),
  expected: z.string().trim().min(4).max(2000),
  actual: z.string().trim().min(4).max(2000),
  severity: z.enum(findingSeverities).default("medium"),
  status: z.enum(findingStatuses).default("open"),
  confidence: confidenceSchema,
  customerImpact: z.string().trim().min(8).max(2000),
  recommendedFix: z.string().trim().min(8).max(2000),
  ownerUserId: z.uuid().optional(),
  dedupeKey: z.string().trim().min(8).max(240),
  firstSeenAt: z.iso.datetime().optional(),
  lastSeenAt: z.iso.datetime().optional(),
  resolvedAt: z.iso.datetime().optional(),
  resolvedByUserId: z.uuid().optional(),
  resolutionSummary: z.string().trim().max(2000).optional(),
  ignoredUntil: z.iso.datetime().optional(),
  metadata: findingMetadataSchema,
});

export const findingEvidenceSchema = z.object({
  findingId: z.uuid(),
  evidenceType: z.enum(findingEvidenceTypes),
  sourceId: z.uuid().optional(),
  sourceDocumentId: z.uuid().optional(),
  sourceChunkId: z.uuid().optional(),
  evaluationRunId: z.uuid().optional(),
  testCaseResultId: z.uuid().optional(),
  quote: z.string().trim().max(2000).optional(),
  artifactPath: z.string().trim().max(1024).optional(),
  citation: z.string().trim().max(500).optional(),
  confidence: confidenceSchema.optional(),
  metadata: findingMetadataSchema,
});

export const findingAssignmentSchema = z.object({
  findingId: z.uuid(),
  assigneeUserId: z.uuid(),
  assignedByUserId: z.uuid().optional(),
  note: z.string().trim().max(1000).optional(),
  unassignedAt: z.iso.datetime().optional(),
  metadata: findingMetadataSchema,
});

export const findingActivitySchema = z.object({
  findingId: z.uuid(),
  actorUserId: z.uuid().optional(),
  activityType: z.enum(findingActivityTypes),
  fromStatus: z.enum(findingStatuses).optional(),
  toStatus: z.enum(findingStatuses).optional(),
  fromAssigneeUserId: z.uuid().optional(),
  toAssigneeUserId: z.uuid().optional(),
  note: z.string().trim().max(2000).optional(),
  metadata: findingMetadataSchema,
});

export type FindingInput = z.infer<typeof findingSchema>;
export type FindingEvidenceInput = z.infer<typeof findingEvidenceSchema>;
export type FindingAssignmentInput = z.infer<typeof findingAssignmentSchema>;
export type FindingActivityInput = z.infer<typeof findingActivitySchema>;

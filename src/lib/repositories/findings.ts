import "server-only";

import {
  type FindingActivityInput,
  type FindingActivityType,
  type FindingAssignmentInput,
  type FindingEvidenceInput,
  type FindingEvidenceType,
  type FindingInput,
  type FindingOwnerTeam,
  type FindingSeverity,
  type FindingStatus,
  type RadarFinding,
  type RadarFindingEvidence,
} from "@/lib/findings/schema";
import {
  findingActivityCreateRequestSchema,
  findingActivityResponseSchema,
  findingAssignmentCreateRequestSchema,
  findingAssignmentResponseSchema,
  findingCreateRequestSchema,
  findingEvidenceCreateRequestSchema,
  findingEvidenceResponseSchema,
  findingResponseSchema,
  findingStatusUpdateRequestSchema,
} from "@/lib/validation";
import {
  assertRepositorySuccess,
  optionalNumber,
  optionalString,
  requireRepositoryRow,
  type JsonRecord,
  type RadarRepositoryClient,
} from "@/lib/repositories/client";

type FindingRow = {
  id: string;
  workspace_id: string;
  assertion_id: string;
  evaluation_run_id: string | null;
  test_case_result_id: string | null;
  title: string;
  summary: string;
  expected: string;
  actual: string;
  severity: FindingSeverity;
  status: FindingStatus;
  confidence: number;
  customer_impact: string;
  recommended_fix: string;
  owner_user_id: string | null;
  dedupe_key: string;
  metadata: JsonRecord;
};

type FindingEvidenceRow = {
  id: string;
  workspace_id: string;
  finding_id: string;
  evidence_type: FindingEvidenceType;
  source_id: string | null;
  source_document_id: string | null;
  source_chunk_id: string | null;
  evaluation_run_id: string | null;
  test_case_result_id: string | null;
  quote: string | null;
  artifact_path: string | null;
  citation: string | null;
  confidence: number | null;
};

type FindingAssignmentRow = {
  id: string;
  workspace_id: string;
  finding_id: string;
  assignee_user_id: string;
  assigned_by_user_id: string | null;
  note: string | null;
  assigned_at: string;
  unassigned_at: string | null;
};

type FindingActivityRow = {
  id: string;
  workspace_id: string;
  finding_id: string;
  actor_user_id: string | null;
  activity_type: FindingActivityType;
  from_status: FindingStatus | null;
  to_status: FindingStatus | null;
  note: string | null;
  created_at: string;
};

export type RadarFindingAssignment = {
  id: string;
  workspaceId: string;
  findingId: string;
  assigneeUserId: string;
  assignedByUserId?: string;
  note?: string;
  assignedAt: string;
  unassignedAt?: string;
};

export type RadarFindingActivity = {
  id: string;
  workspaceId: string;
  findingId: string;
  actorUserId?: string;
  activityType: FindingActivityType;
  fromStatus?: FindingStatus;
  toStatus?: FindingStatus;
  note?: string;
  createdAt: string;
};

export type FindingStatusUpdateInput = {
  status: FindingStatus;
  resolvedAt?: string;
  resolvedByUserId?: string;
  resolutionSummary?: string;
  clearResolution?: boolean;
};

export type FindingOwnershipUpdateInput = {
  ownerUserId?: string;
  ownerTeam?: FindingOwnerTeam;
  severity: FindingSeverity;
  metadata: JsonRecord;
};

const findingSelect =
  "id, workspace_id, assertion_id, evaluation_run_id, test_case_result_id, title, summary, expected, actual, severity, status, confidence, customer_impact, recommended_fix, owner_user_id, dedupe_key, metadata";

const findingEvidenceSelect =
  "id, workspace_id, finding_id, evidence_type, source_id, source_document_id, source_chunk_id, evaluation_run_id, test_case_result_id, quote, artifact_path, citation, confidence";

export async function listFindings(client: RadarRepositoryClient, workspaceId: string) {
  const { data, error } = await client
    .from("findings")
    .select(findingSelect)
    .eq("workspace_id", workspaceId)
    .order("last_seen_at", { ascending: false })
    .returns<FindingRow[]>();

  assertRepositorySuccess(error, "Unable to list findings");
  return (data ?? []).map(mapFindingRow);
}

export async function listFindingsForAssertion(
  client: RadarRepositoryClient,
  workspaceId: string,
  assertionId: string,
  options: { limit?: number } = {},
) {
  const { data, error } = await client
    .from("findings")
    .select(findingSelect)
    .eq("workspace_id", workspaceId)
    .eq("assertion_id", assertionId)
    .order("last_seen_at", { ascending: false })
    .limit(options.limit ?? 8)
    .returns<FindingRow[]>();

  assertRepositorySuccess(error, "Unable to list assertion findings");
  return (data ?? []).map(mapFindingRow);
}

export async function getFindingById(client: RadarRepositoryClient, workspaceId: string, findingId: string) {
  const { data, error } = await client
    .from("findings")
    .select(findingSelect)
    .eq("workspace_id", workspaceId)
    .eq("id", findingId)
    .maybeSingle<FindingRow>();

  assertRepositorySuccess(error, "Unable to load finding");
  return data ? mapFindingRow(data) : null;
}

export async function getFindingByDedupeKey(client: RadarRepositoryClient, workspaceId: string, dedupeKey: string) {
  const { data, error } = await client
    .from("findings")
    .select(findingSelect)
    .eq("workspace_id", workspaceId)
    .eq("dedupe_key", dedupeKey)
    .maybeSingle<FindingRow>();

  assertRepositorySuccess(error, "Unable to load finding by dedupe key");
  return data ? mapFindingRow(data) : null;
}

export async function createFinding(client: RadarRepositoryClient, workspaceId: string, input: FindingInput) {
  const parsedInput = findingCreateRequestSchema.parse(input);
  const { data, error } = await client
    .from("findings")
    .insert({
      workspace_id: workspaceId,
      assertion_id: parsedInput.assertionId,
      evaluation_run_id: parsedInput.evaluationRunId ?? null,
      test_case_result_id: parsedInput.testCaseResultId ?? null,
      title: parsedInput.title,
      summary: parsedInput.summary,
      expected: parsedInput.expected,
      actual: parsedInput.actual,
      severity: parsedInput.severity,
      status: parsedInput.status,
      confidence: parsedInput.confidence,
      customer_impact: parsedInput.customerImpact,
      recommended_fix: parsedInput.recommendedFix,
      owner_user_id: parsedInput.ownerUserId ?? null,
      dedupe_key: parsedInput.dedupeKey,
      first_seen_at: parsedInput.firstSeenAt,
      last_seen_at: parsedInput.lastSeenAt,
      resolved_at: parsedInput.resolvedAt ?? null,
      resolved_by_user_id: parsedInput.resolvedByUserId ?? null,
      resolution_summary: parsedInput.resolutionSummary ?? null,
      ignored_until: parsedInput.ignoredUntil ?? null,
      metadata: parsedInput.metadata,
    })
    .select(findingSelect)
    .single<FindingRow>();

  assertRepositorySuccess(error, "Unable to create finding");
  return mapFindingRow(requireRepositoryRow(data, "Finding insert returned no row"));
}

export async function updateFindingOccurrence(
  client: RadarRepositoryClient,
  workspaceId: string,
  findingId: string,
  input: Pick<FindingInput, "evaluationRunId" | "testCaseResultId" | "summary" | "actual" | "severity" | "confidence" | "lastSeenAt" | "metadata">,
) {
  const { data, error } = await client
    .from("findings")
    .update({
      evaluation_run_id: input.evaluationRunId ?? null,
      test_case_result_id: input.testCaseResultId ?? null,
      summary: input.summary,
      actual: input.actual,
      severity: input.severity,
      confidence: input.confidence,
      last_seen_at: input.lastSeenAt,
      metadata: input.metadata,
    })
    .eq("workspace_id", workspaceId)
    .eq("id", findingId)
    .select(findingSelect)
    .single<FindingRow>();

  assertRepositorySuccess(error, "Unable to update finding occurrence");
  return mapFindingRow(requireRepositoryRow(data, "Finding occurrence update returned no row"));
}

export async function updateFindingStatus(
  client: RadarRepositoryClient,
  workspaceId: string,
  findingId: string,
  input: FindingStatusUpdateInput,
) {
  const parsedInput = findingStatusUpdateRequestSchema.parse({ findingId, ...input });
  const resolutionStatus = parsedInput.status === "resolved" || parsedInput.status === "false_positive";
  const resolutionFields = resolutionStatus
    ? {
        resolved_at: parsedInput.resolvedAt,
        resolved_by_user_id: parsedInput.resolvedByUserId,
        resolution_summary: parsedInput.resolutionSummary,
      }
    : parsedInput.clearResolution
      ? {
          resolved_at: null,
          resolved_by_user_id: null,
          resolution_summary: null,
          ignored_until: null,
        }
      : {};
  const { data, error } = await client
    .from("findings")
    .update({
      status: parsedInput.status,
      ...resolutionFields,
    })
    .eq("workspace_id", workspaceId)
    .eq("id", parsedInput.findingId)
    .select(findingSelect)
    .single<FindingRow>();

  assertRepositorySuccess(error, "Unable to update finding status");
  return mapFindingRow(requireRepositoryRow(data, "Finding update returned no row"));
}

export async function updateFindingOwnership(
  client: RadarRepositoryClient,
  workspaceId: string,
  findingId: string,
  input: FindingOwnershipUpdateInput,
) {
  const { data, error } = await client
    .from("findings")
    .update({
      owner_user_id: input.ownerUserId ?? null,
      severity: input.severity,
      metadata: input.metadata,
    })
    .eq("workspace_id", workspaceId)
    .eq("id", findingId)
    .select(findingSelect)
    .single<FindingRow>();

  assertRepositorySuccess(error, "Unable to update finding ownership");
  return mapFindingRow(requireRepositoryRow(data, "Finding ownership update returned no row"));
}

export async function closeActiveFindingAssignments(
  client: RadarRepositoryClient,
  workspaceId: string,
  findingId: string,
  unassignedAt: string,
) {
  const { error } = await client
    .from("finding_assignments")
    .update({ unassigned_at: unassignedAt })
    .eq("workspace_id", workspaceId)
    .eq("finding_id", findingId)
    .is("unassigned_at", null);

  assertRepositorySuccess(error, "Unable to close active finding assignments");
}

export async function addFindingEvidence(
  client: RadarRepositoryClient,
  workspaceId: string,
  input: FindingEvidenceInput,
) {
  const parsedInput = findingEvidenceCreateRequestSchema.parse(input);
  const { data, error } = await client
    .from("finding_evidence")
    .insert({
      workspace_id: workspaceId,
      finding_id: parsedInput.findingId,
      evidence_type: parsedInput.evidenceType,
      source_id: parsedInput.sourceId ?? null,
      source_document_id: parsedInput.sourceDocumentId ?? null,
      source_chunk_id: parsedInput.sourceChunkId ?? null,
      evaluation_run_id: parsedInput.evaluationRunId ?? null,
      test_case_result_id: parsedInput.testCaseResultId ?? null,
      quote: parsedInput.quote ?? null,
      artifact_path: parsedInput.artifactPath ?? null,
      citation: parsedInput.citation ?? null,
      confidence: parsedInput.confidence ?? null,
      metadata: parsedInput.metadata,
    })
    .select(findingEvidenceSelect)
    .single<FindingEvidenceRow>();

  assertRepositorySuccess(error, "Unable to add finding evidence");
  return mapFindingEvidenceRow(requireRepositoryRow(data, "Finding evidence insert returned no row"));
}

export async function listFindingEvidence(client: RadarRepositoryClient, workspaceId: string, findingId: string) {
  const { data, error } = await client
    .from("finding_evidence")
    .select(findingEvidenceSelect)
    .eq("workspace_id", workspaceId)
    .eq("finding_id", findingId)
    .order("created_at", { ascending: true })
    .returns<FindingEvidenceRow[]>();

  assertRepositorySuccess(error, "Unable to list finding evidence");
  return (data ?? []).map(mapFindingEvidenceRow);
}

export async function listFindingActivity(client: RadarRepositoryClient, workspaceId: string, findingId: string) {
  const { data, error } = await client
    .from("finding_activity")
    .select("id, workspace_id, finding_id, actor_user_id, activity_type, from_status, to_status, note, created_at")
    .eq("workspace_id", workspaceId)
    .eq("finding_id", findingId)
    .order("created_at", { ascending: false })
    .returns<FindingActivityRow[]>();

  assertRepositorySuccess(error, "Unable to list finding activity");
  return (data ?? []).map(mapFindingActivityRow);
}

export async function assignFinding(
  client: RadarRepositoryClient,
  workspaceId: string,
  input: FindingAssignmentInput,
) {
  const parsedInput = findingAssignmentCreateRequestSchema.parse(input);
  const { data, error } = await client
    .from("finding_assignments")
    .insert({
      workspace_id: workspaceId,
      finding_id: parsedInput.findingId,
      assignee_user_id: parsedInput.assigneeUserId,
      assigned_by_user_id: parsedInput.assignedByUserId ?? null,
      note: parsedInput.note ?? null,
      unassigned_at: parsedInput.unassignedAt ?? null,
      metadata: parsedInput.metadata,
    })
    .select("id, workspace_id, finding_id, assignee_user_id, assigned_by_user_id, note, assigned_at, unassigned_at")
    .single<FindingAssignmentRow>();

  assertRepositorySuccess(error, "Unable to assign finding");
  return mapFindingAssignmentRow(requireRepositoryRow(data, "Finding assignment insert returned no row"));
}

export async function recordFindingActivity(
  client: RadarRepositoryClient,
  workspaceId: string,
  input: FindingActivityInput,
) {
  const parsedInput = findingActivityCreateRequestSchema.parse(input);
  const { data, error } = await client
    .from("finding_activity")
    .insert({
      workspace_id: workspaceId,
      finding_id: parsedInput.findingId,
      actor_user_id: parsedInput.actorUserId ?? null,
      activity_type: parsedInput.activityType,
      from_status: parsedInput.fromStatus ?? null,
      to_status: parsedInput.toStatus ?? null,
      from_assignee_user_id: parsedInput.fromAssigneeUserId ?? null,
      to_assignee_user_id: parsedInput.toAssigneeUserId ?? null,
      note: parsedInput.note ?? null,
      metadata: parsedInput.metadata,
    })
    .select("id, workspace_id, finding_id, actor_user_id, activity_type, from_status, to_status, note, created_at")
    .single<FindingActivityRow>();

  assertRepositorySuccess(error, "Unable to record finding activity");
  return mapFindingActivityRow(requireRepositoryRow(data, "Finding activity insert returned no row"));
}

function mapFindingRow(row: FindingRow): RadarFinding {
  return findingResponseSchema.parse({
    id: row.id,
    workspaceId: row.workspace_id,
    assertionId: row.assertion_id,
    evaluationRunId: optionalString(row.evaluation_run_id),
    testCaseResultId: optionalString(row.test_case_result_id),
    title: row.title,
    summary: row.summary,
    expected: row.expected,
    actual: row.actual,
    severity: row.severity,
    status: row.status,
    confidence: row.confidence,
    customerImpact: row.customer_impact,
    recommendedFix: row.recommended_fix,
    ownerUserId: optionalString(row.owner_user_id),
    dedupeKey: row.dedupe_key,
    metadata: row.metadata,
  });
}

function mapFindingEvidenceRow(row: FindingEvidenceRow): RadarFindingEvidence {
  return findingEvidenceResponseSchema.parse({
    id: row.id,
    workspaceId: row.workspace_id,
    findingId: row.finding_id,
    evidenceType: row.evidence_type,
    sourceId: optionalString(row.source_id),
    sourceDocumentId: optionalString(row.source_document_id),
    sourceChunkId: optionalString(row.source_chunk_id),
    evaluationRunId: optionalString(row.evaluation_run_id),
    testCaseResultId: optionalString(row.test_case_result_id),
    quote: optionalString(row.quote),
    artifactPath: optionalString(row.artifact_path),
    citation: optionalString(row.citation),
    confidence: optionalNumber(row.confidence),
  });
}

function mapFindingAssignmentRow(row: FindingAssignmentRow): RadarFindingAssignment {
  return findingAssignmentResponseSchema.parse({
    id: row.id,
    workspaceId: row.workspace_id,
    findingId: row.finding_id,
    assigneeUserId: row.assignee_user_id,
    assignedByUserId: optionalString(row.assigned_by_user_id),
    note: optionalString(row.note),
    assignedAt: row.assigned_at,
    unassignedAt: optionalString(row.unassigned_at),
  });
}

function mapFindingActivityRow(row: FindingActivityRow): RadarFindingActivity {
  return findingActivityResponseSchema.parse({
    id: row.id,
    workspaceId: row.workspace_id,
    findingId: row.finding_id,
    actorUserId: optionalString(row.actor_user_id),
    activityType: row.activity_type,
    fromStatus: row.from_status ?? undefined,
    toStatus: row.to_status ?? undefined,
    note: optionalString(row.note),
    createdAt: row.created_at,
  });
}

import "server-only";

import {
  type AssertionCategory,
  type AssertionPriority,
  type AssertionRunScheduleInput,
  type AssertionScheduleCadence,
  type AssertionSourceRelationshipType,
  type AssertionSourceInput,
  type AssertionStatus,
  type CreateAssertionInput,
  type RadarAssertion,
  type RadarTestCase,
  type RunnerType,
  type TestCaseInput,
  type TestCaseStatus,
  type TestCaseType,
} from "@/lib/assertions/schema";
import {
  assertionCreateRequestSchema,
  assertionResponseSchema,
  assertionRunScheduleResponseSchema,
  assertionScheduleUpsertRequestSchema,
  assertionSourceLinkRequestSchema,
  assertionSourceResponseSchema,
  assertionUpdateRequestSchema,
  testCaseCreateRequestSchema,
  testCaseResponseSchema,
} from "@/lib/validation";
import {
  assertRepositorySuccess,
  jsonRecord,
  optionalString,
  requireRepositoryRow,
  type JsonRecord,
  type RadarRepositoryClient,
} from "@/lib/repositories/client";

type AssertionRow = {
  id: string;
  workspace_id: string;
  title: string;
  purpose: string;
  expected_behavior: string;
  category: AssertionCategory;
  priority: AssertionPriority;
  runner_type: RunnerType;
  status: AssertionStatus;
  owner_user_id: string | null;
  created_by: string;
};

type AssertionSourceRow = {
  workspace_id: string;
  assertion_id: string;
  source_id: string;
  is_required: boolean;
  relationship_type: AssertionSourceRelationshipType;
  purpose: string | null;
};

type AssertionRunScheduleRow = {
  id: string;
  workspace_id: string;
  assertion_id: string;
  cadence: AssertionScheduleCadence;
  timezone: string;
  source_change_trigger: boolean;
  is_enabled: boolean;
  next_run_at: string | null;
  metadata: JsonRecord;
};

type TestCaseRow = {
  id: string;
  workspace_id: string;
  assertion_id: string;
  title: string;
  type: TestCaseType;
  status: TestCaseStatus;
  input: JsonRecord;
  expected_result: string;
  ordinal: number;
};

const assertionSelect =
  "id, workspace_id, title, purpose, expected_behavior, category, priority, runner_type, status, owner_user_id, created_by";
const assertionSourceSelect = "workspace_id, assertion_id, source_id, is_required, relationship_type, purpose";

const assertionPriorityRank: Record<AssertionPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export type RadarAssertionSource = {
  workspaceId: string;
  assertionId: string;
  sourceId: string;
  isRequired: boolean;
  relationshipType: AssertionSourceRelationshipType;
  purpose?: string;
};

export type RadarAssertionRunSchedule = {
  id: string;
  workspaceId: string;
  assertionId: string;
  cadence: AssertionScheduleCadence;
  timezone: string;
  sourceChangeTrigger: boolean;
  isEnabled: boolean;
  nextRunAt?: string;
  metadata: JsonRecord;
};

export type RadarSourceChangeAffectedAssertion = {
  assertion: RadarAssertion;
  sourceLink: RadarAssertionSource;
  sourceChangeTrigger: boolean;
  scheduleEnabled: boolean;
  scheduleCadence?: AssertionScheduleCadence;
  nextRunAt?: string;
  shouldRerun: boolean;
  reason: "linked_source_changed" | "assertion_not_active" | "source_change_trigger_disabled";
};

export async function listAssertions(client: RadarRepositoryClient, workspaceId: string) {
  const { data, error } = await client
    .from("assertions")
    .select(assertionSelect)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .returns<AssertionRow[]>();

  assertRepositorySuccess(error, "Unable to list assertions");
  return (data ?? []).map(mapAssertionRow);
}

export async function getAssertionById(client: RadarRepositoryClient, workspaceId: string, assertionId: string) {
  const { data, error } = await client
    .from("assertions")
    .select(assertionSelect)
    .eq("workspace_id", workspaceId)
    .eq("id", assertionId)
    .maybeSingle<AssertionRow>();

  assertRepositorySuccess(error, "Unable to load assertion");
  return data ? mapAssertionRow(data) : null;
}

export async function createAssertion(
  client: RadarRepositoryClient,
  workspaceId: string,
  createdBy: string,
  input: CreateAssertionInput,
) {
  const parsedInput = assertionCreateRequestSchema.parse(input);
  const { data, error } = await client
    .from("assertions")
    .insert({
      workspace_id: workspaceId,
      title: parsedInput.title,
      purpose: parsedInput.purpose,
      expected_behavior: parsedInput.expectedBehavior,
      category: parsedInput.category,
      priority: parsedInput.priority,
      runner_type: parsedInput.runnerType,
      status: parsedInput.status,
      owner_user_id: parsedInput.ownerUserId ?? null,
      created_by: createdBy,
      metadata: parsedInput.metadata,
    })
    .select(assertionSelect)
    .single<AssertionRow>();

  assertRepositorySuccess(error, "Unable to create assertion");
  return mapAssertionRow(requireRepositoryRow(data, "Assertion insert returned no row"));
}

export async function updateAssertion(
  client: RadarRepositoryClient,
  workspaceId: string,
  assertionId: string,
  input: Partial<CreateAssertionInput>,
) {
  const parsedInput = assertionUpdateRequestSchema.parse(input);
  const { data, error } = await client
    .from("assertions")
    .update({
      title: parsedInput.title,
      purpose: parsedInput.purpose,
      expected_behavior: parsedInput.expectedBehavior,
      category: parsedInput.category,
      priority: parsedInput.priority,
      runner_type: parsedInput.runnerType,
      status: parsedInput.status,
      owner_user_id: parsedInput.ownerUserId,
      metadata: parsedInput.metadata,
    })
    .eq("workspace_id", workspaceId)
    .eq("id", assertionId)
    .select(assertionSelect)
    .single<AssertionRow>();

  assertRepositorySuccess(error, "Unable to update assertion");
  return mapAssertionRow(requireRepositoryRow(data, "Assertion update returned no row"));
}

export async function deleteAssertion(client: RadarRepositoryClient, workspaceId: string, assertionId: string) {
  const { error } = await client.from("assertions").delete().eq("workspace_id", workspaceId).eq("id", assertionId);
  assertRepositorySuccess(error, "Unable to delete assertion");
}

export async function linkAssertionSource(
  client: RadarRepositoryClient,
  workspaceId: string,
  input: AssertionSourceInput,
) {
  const parsedInput = assertionSourceLinkRequestSchema.parse(input);
  const { data, error } = await client
    .from("assertion_sources")
    .upsert({
      workspace_id: workspaceId,
      assertion_id: parsedInput.assertionId,
      source_id: parsedInput.sourceId,
      is_required: parsedInput.isRequired,
      relationship_type: parsedInput.relationshipType,
      purpose: parsedInput.purpose ?? null,
    })
    .select(assertionSourceSelect)
    .single<AssertionSourceRow>();

  assertRepositorySuccess(error, "Unable to link assertion source");
  return mapAssertionSourceRow(requireRepositoryRow(data, "Assertion source link returned no row"));
}

export async function listAssertionSourcesForAssertion(
  client: RadarRepositoryClient,
  workspaceId: string,
  assertionId: string,
) {
  const { data, error } = await client
    .from("assertion_sources")
    .select(assertionSourceSelect)
    .eq("workspace_id", workspaceId)
    .eq("assertion_id", assertionId)
    .returns<AssertionSourceRow[]>();

  assertRepositorySuccess(error, "Unable to list assertion sources");
  return (data ?? []).map(mapAssertionSourceRow);
}

export async function listAssertionSourcesForSource(
  client: RadarRepositoryClient,
  workspaceId: string,
  sourceId: string,
) {
  const { data, error } = await client
    .from("assertion_sources")
    .select(assertionSourceSelect)
    .eq("workspace_id", workspaceId)
    .eq("source_id", sourceId)
    .returns<AssertionSourceRow[]>();

  assertRepositorySuccess(error, "Unable to list source assertion links");
  return (data ?? []).map(mapAssertionSourceRow);
}

export async function listSourceChangeAffectedAssertions(
  client: RadarRepositoryClient,
  workspaceId: string,
  sourceId: string,
) {
  const links = await listAssertionSourcesForSource(client, workspaceId, sourceId);

  if (links.length === 0) {
    return [];
  }

  const assertionIds = [...new Set(links.map((link) => link.assertionId))];
  const { data: assertionRows, error: assertionError } = await client
    .from("assertions")
    .select(assertionSelect)
    .eq("workspace_id", workspaceId)
    .in("id", assertionIds)
    .returns<AssertionRow[]>();

  assertRepositorySuccess(assertionError, "Unable to list source-linked assertions");

  const { data: scheduleRows, error: scheduleError } = await client
    .from("assertion_runs_schedule")
    .select("id, workspace_id, assertion_id, cadence, timezone, source_change_trigger, is_enabled, next_run_at, metadata")
    .eq("workspace_id", workspaceId)
    .in("assertion_id", assertionIds)
    .returns<AssertionRunScheduleRow[]>();

  assertRepositorySuccess(scheduleError, "Unable to list source-linked assertion schedules");

  const assertionsById = new Map((assertionRows ?? []).map((row) => [row.id, mapAssertionRow(row)]));
  const schedulesByAssertionId = new Map(
    (scheduleRows ?? []).map((row) => [row.assertion_id, mapAssertionRunScheduleRow(row)]),
  );

  return links
    .map((link) => {
      const assertion = assertionsById.get(link.assertionId);

      if (!assertion) {
        return null;
      }

      const schedule = schedulesByAssertionId.get(link.assertionId);
      const sourceChangeTrigger = schedule?.sourceChangeTrigger ?? true;
      const shouldRerun = assertion.status === "active" && sourceChangeTrigger;
      const reason = affectedAssertionReason(assertion.status, sourceChangeTrigger);
      const affectedAssertion: RadarSourceChangeAffectedAssertion = {
        assertion,
        sourceLink: link,
        sourceChangeTrigger,
        scheduleEnabled: schedule?.isEnabled ?? false,
        shouldRerun,
        reason,
      };

      if (schedule?.cadence) {
        affectedAssertion.scheduleCadence = schedule.cadence;
      }

      if (schedule?.nextRunAt) {
        affectedAssertion.nextRunAt = schedule.nextRunAt;
      }

      return affectedAssertion;
    })
    .filter((affected): affected is RadarSourceChangeAffectedAssertion => affected !== null)
    .sort(sortAffectedAssertions);
}

export async function upsertAssertionRunSchedule(
  client: RadarRepositoryClient,
  workspaceId: string,
  input: AssertionRunScheduleInput,
) {
  const parsedInput = assertionScheduleUpsertRequestSchema.parse(input);
  const { data, error } = await client
    .from("assertion_runs_schedule")
    .upsert({
      workspace_id: workspaceId,
      assertion_id: parsedInput.assertionId,
      cadence: parsedInput.cadence,
      timezone: parsedInput.timezone,
      source_change_trigger: parsedInput.sourceChangeTrigger,
      is_enabled: parsedInput.isEnabled,
      next_run_at: parsedInput.nextRunAt ?? null,
      metadata: parsedInput.metadata,
    })
    .select("id, workspace_id, assertion_id, cadence, timezone, source_change_trigger, is_enabled, next_run_at, metadata")
    .single<AssertionRunScheduleRow>();

  assertRepositorySuccess(error, "Unable to upsert assertion run schedule");
  return mapAssertionRunScheduleRow(requireRepositoryRow(data, "Assertion schedule upsert returned no row"));
}

export async function listTestCasesForAssertion(
  client: RadarRepositoryClient,
  workspaceId: string,
  assertionId: string,
) {
  const { data, error } = await client
    .from("test_cases")
    .select("id, workspace_id, assertion_id, title, type, status, input, expected_result, ordinal")
    .eq("workspace_id", workspaceId)
    .eq("assertion_id", assertionId)
    .order("ordinal", { ascending: true })
    .returns<TestCaseRow[]>();

  assertRepositorySuccess(error, "Unable to list test cases");
  return (data ?? []).map(mapTestCaseRow);
}

export async function getTestCaseById(client: RadarRepositoryClient, workspaceId: string, testCaseId: string) {
  const { data, error } = await client
    .from("test_cases")
    .select("id, workspace_id, assertion_id, title, type, status, input, expected_result, ordinal")
    .eq("workspace_id", workspaceId)
    .eq("id", testCaseId)
    .maybeSingle<TestCaseRow>();

  assertRepositorySuccess(error, "Unable to load test case");
  return data ? mapTestCaseRow(data) : null;
}

export async function createTestCase(
  client: RadarRepositoryClient,
  workspaceId: string,
  createdBy: string,
  input: TestCaseInput,
) {
  const parsedInput = testCaseCreateRequestSchema.parse(input);
  const { data, error } = await client
    .from("test_cases")
    .insert({
      workspace_id: workspaceId,
      assertion_id: parsedInput.assertionId,
      title: parsedInput.title,
      type: parsedInput.type,
      status: parsedInput.status,
      input: parsedInput.input,
      expected_result: parsedInput.expectedResult,
      ordinal: parsedInput.ordinal,
      created_by: createdBy,
      metadata: parsedInput.metadata,
    })
    .select("id, workspace_id, assertion_id, title, type, status, input, expected_result, ordinal")
    .single<TestCaseRow>();

  assertRepositorySuccess(error, "Unable to create test case");
  return mapTestCaseRow(requireRepositoryRow(data, "Test case insert returned no row"));
}

function mapAssertionRow(row: AssertionRow): RadarAssertion {
  return assertionResponseSchema.parse({
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    purpose: row.purpose,
    expectedBehavior: row.expected_behavior,
    category: row.category,
    priority: row.priority,
    runnerType: row.runner_type,
    status: row.status,
    ownerUserId: optionalString(row.owner_user_id),
    createdBy: row.created_by,
  });
}

function mapAssertionSourceRow(row: AssertionSourceRow): RadarAssertionSource {
  return assertionSourceResponseSchema.parse({
    workspaceId: row.workspace_id,
    assertionId: row.assertion_id,
    sourceId: row.source_id,
    isRequired: row.is_required,
    relationshipType: row.relationship_type,
    purpose: optionalString(row.purpose),
  });
}

function mapAssertionRunScheduleRow(row: AssertionRunScheduleRow): RadarAssertionRunSchedule {
  return assertionRunScheduleResponseSchema.parse({
    id: row.id,
    workspaceId: row.workspace_id,
    assertionId: row.assertion_id,
    cadence: row.cadence,
    timezone: row.timezone,
    sourceChangeTrigger: row.source_change_trigger,
    isEnabled: row.is_enabled,
    nextRunAt: optionalString(row.next_run_at),
    metadata: jsonRecord(row.metadata),
  });
}

function mapTestCaseRow(row: TestCaseRow): RadarTestCase {
  return testCaseResponseSchema.parse({
    id: row.id,
    workspaceId: row.workspace_id,
    assertionId: row.assertion_id,
    title: row.title,
    type: row.type,
    status: row.status,
    input: jsonRecord(row.input),
    expectedResult: row.expected_result,
    ordinal: row.ordinal,
  });
}

function affectedAssertionReason(
  assertionStatus: AssertionStatus,
  sourceChangeTrigger: boolean,
): RadarSourceChangeAffectedAssertion["reason"] {
  if (assertionStatus !== "active") {
    return "assertion_not_active";
  }

  if (!sourceChangeTrigger) {
    return "source_change_trigger_disabled";
  }

  return "linked_source_changed";
}

function sortAffectedAssertions(
  first: RadarSourceChangeAffectedAssertion,
  second: RadarSourceChangeAffectedAssertion,
) {
  if (first.shouldRerun !== second.shouldRerun) {
    return first.shouldRerun ? -1 : 1;
  }

  const priorityDelta = assertionPriorityRank[first.assertion.priority] - assertionPriorityRank[second.assertion.priority];

  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  return first.assertion.title.localeCompare(second.assertion.title);
}

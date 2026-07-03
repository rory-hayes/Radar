import "server-only";

import {
  type AssertionCategory,
  type AssertionPriority,
  type AssertionRunScheduleInput,
  type AssertionScheduleCadence,
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

export type RadarAssertionSource = {
  workspaceId: string;
  assertionId: string;
  sourceId: string;
  isRequired: boolean;
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
      purpose: parsedInput.purpose ?? null,
    })
    .select("workspace_id, assertion_id, source_id, is_required, purpose")
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
    .select("workspace_id, assertion_id, source_id, is_required, purpose")
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
    .select("workspace_id, assertion_id, source_id, is_required, purpose")
    .eq("workspace_id", workspaceId)
    .eq("source_id", sourceId)
    .returns<AssertionSourceRow[]>();

  assertRepositorySuccess(error, "Unable to list source assertion links");
  return (data ?? []).map(mapAssertionSourceRow);
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

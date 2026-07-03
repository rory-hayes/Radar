"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  AssertionSuggestionError,
  createOpenAIAssertionSuggestionProvider,
  type AssertionSuggestionSourceContext,
} from "@/lib/assertions/ai-suggestions";
import {
  createOpenAITestCaseSuggestionProvider,
  TestCaseSuggestionError,
  type TestCaseSuggestionSourceContext,
} from "@/lib/assertions/ai-test-cases";
import {
  assertionCategories,
  assertionPriorities,
  assertionScheduleCadences,
  assertionStatuses,
  runnerTypes,
  type CreateAssertionInput,
  testCaseTypes,
  type TestCaseInput,
} from "@/lib/assertions/schema";
import {
  approveTestCase,
  createAssertion,
  createTestCase,
  deleteTestCase,
  disableTestCase,
  getAssertionById,
  getTestCaseById,
  listAssertionSourcesForAssertion,
  listSourceChunksPreview,
  listSources,
  listTestCasesForAssertion,
  replaceAssertionSourcesForAssertion,
  updateAssertion,
  updateTestCase,
  upsertAssertionRunSchedule,
} from "@/lib/repositories";
import {
  runWorkspaceServerAction,
  serverActionError,
  serverActionErrorState,
} from "@/lib/server/guardrails";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional(),
);

const assertionFormActionSchema = z.object({
  mode: z.enum(["create", "update"]),
  assertionId: optionalTrimmedString.pipe(z.uuid().optional()),
  title: z.string().trim().min(4, "Assertion title must be at least 4 characters.").max(180),
  purpose: z.string().trim().min(8, "Purpose must be at least 8 characters.").max(1000),
  expectedBehavior: z.string().trim().min(8, "Expected behavior must be at least 8 characters.").max(2000),
  category: z.enum(assertionCategories),
  priority: z.enum(assertionPriorities),
  runnerType: z.enum(runnerTypes),
  status: z.enum(assertionStatuses),
  ownerUserId: optionalTrimmedString.pipe(z.uuid("Owner must be a user id.").optional()),
  scheduleCadence: z.enum(assertionScheduleCadences),
  scheduleEnabled: z.boolean(),
  sourceChangeTrigger: z.boolean(),
  timezone: z.string().trim().min(1).max(80),
  sourceIds: z.array(z.uuid()).max(20),
}).superRefine((input, context) => {
  if (input.mode === "update" && !input.assertionId) {
    context.addIssue({
      code: "custom",
      path: ["assertionId"],
      message: "Assertion id is required when updating an assertion.",
    });
  }
});

type AssertionFormInput = z.infer<typeof assertionFormActionSchema>;

export type AssertionFormState = {
  error?: string;
};

const assertionSourceLinksActionSchema = z.object({
  assertionId: z.uuid(),
  sourceIds: z.array(z.uuid()).max(20),
});

export type AssertionSourceLinkingState = {
  error?: string;
  success?: string;
};

const assertionSuggestionActionSchema = z.object({
  sourceIds: z.array(z.uuid()).min(1, "Select at least one source for AI suggestions.").max(5),
  maxSuggestions: z.number().int().min(1).max(5).default(3),
});

export type AssertionSuggestionState = {
  error?: string;
};

const testCaseFormActionSchema = z.object({
  mode: z.enum(["create", "update"]),
  assertionId: z.uuid(),
  testCaseId: optionalTrimmedString.pipe(z.uuid().optional()),
  title: z.string().trim().min(4, "Test case title must be at least 4 characters.").max(180),
  type: z.enum(testCaseTypes),
  inputText: z.string().trim().min(4, "Test input must be at least 4 characters.").max(2000),
  expectedResult: z.string().trim().min(8, "Expected result must be at least 8 characters.").max(2000),
  ordinal: z.number().int().min(0).max(999),
}).superRefine((input, context) => {
  if (input.mode === "update" && !input.testCaseId) {
    context.addIssue({
      code: "custom",
      path: ["testCaseId"],
      message: "Test case id is required when updating a test case.",
    });
  }
});

const testCaseStatusActionSchema = z.object({
  assertionId: z.uuid(),
  testCaseId: z.uuid(),
});

type TestCaseFormInput = z.infer<typeof testCaseFormActionSchema>;

export type TestCaseFormState = {
  error?: string;
  success?: string;
};

const testCaseSuggestionActionSchema = z.object({
  assertionId: z.uuid(),
  maxSuggestions: z.number().int().min(1).max(5).default(3),
});

export type TestCaseSuggestionState = {
  error?: string;
  success?: string;
};

export async function createAssertionAction(
  _previousState: AssertionFormState,
  formData: FormData,
): Promise<AssertionFormState> {
  const result = await runWorkspaceServerAction(
    {
      input: assertionFormInputFromFormData("create", formData),
      permission: "assertion:create",
      schema: assertionFormActionSchema,
    },
    async ({ input, membership, user }) => {
      const supabase = await createSupabaseServerClient();

      if (!supabase) {
        throw serverActionError("Supabase is not configured for this environment.");
      }

      const assertion = await createAssertion(supabase, membership.workspace.id, user.id, buildAssertionInput(input));

      await saveAssertionDetails(supabase, membership.workspace.id, assertion.id, input);
      return assertion;
    },
  );

  const error = serverActionErrorState(result);

  if (error) {
    return { error };
  }

  revalidatePath("/assertions");
  redirect("/assertions");
}

export async function updateAssertionAction(
  _previousState: AssertionFormState,
  formData: FormData,
): Promise<AssertionFormState> {
  const result = await runWorkspaceServerAction(
    {
      input: assertionFormInputFromFormData("update", formData),
      permission: "assertion:edit",
      schema: assertionFormActionSchema,
    },
    async ({ input, membership }) => {
      const supabase = await createSupabaseServerClient();

      if (!supabase) {
        throw serverActionError("Supabase is not configured for this environment.");
      }

      if (!input.assertionId) {
        throw serverActionError("Assertion id is required when updating an assertion.", "validation");
      }

      const assertion = await updateAssertion(supabase, membership.workspace.id, input.assertionId, buildAssertionInput(input));

      await saveAssertionDetails(supabase, membership.workspace.id, input.assertionId, input);
      return assertion;
    },
  );

  const error = serverActionErrorState(result);

  if (error) {
    return { error };
  }

  revalidatePath("/assertions");
  redirect("/assertions");
}

export async function updateAssertionSourceLinksAction(
  _previousState: AssertionSourceLinkingState,
  formData: FormData,
): Promise<AssertionSourceLinkingState> {
  const result = await runWorkspaceServerAction(
    {
      input: {
        assertionId: String(formData.get("assertionId") ?? ""),
        sourceIds: formData.getAll("sourceIds").map(String),
      },
      permission: "assertion:edit",
      schema: assertionSourceLinksActionSchema,
    },
    async ({ input, membership }) => {
      const supabase = await createSupabaseServerClient();

      if (!supabase) {
        throw serverActionError("Supabase is not configured for this environment.");
      }

      const assertion = await getAssertionById(supabase, membership.workspace.id, input.assertionId);

      if (!assertion) {
        throw serverActionError("Assertion not found in this workspace.", "validation");
      }

      const workspaceSources = await listSources(supabase, membership.workspace.id);
      const workspaceSourceIds = new Set(workspaceSources.map((source) => source.id));
      const invalidSourceId = input.sourceIds.find((sourceId) => !workspaceSourceIds.has(sourceId));

      if (invalidSourceId) {
        throw serverActionError("One or more selected sources are not available in this workspace.", "validation");
      }

      await replaceAssertionSourcesForAssertion(
        supabase,
        membership.workspace.id,
        input.assertionId,
        input.sourceIds,
      );

      return input.sourceIds.length;
    },
  );

  const error = serverActionErrorState(result);

  if (error) {
    return { error };
  }

  revalidatePath("/assertions");
  revalidatePath(`/assertions/${String(formData.get("assertionId") ?? "")}`);

  const sourceCount = result.ok ? result.data : 0;
  return {
    success: sourceCount === 1 ? "1 source linked to this assertion." : `${sourceCount} sources linked to this assertion.`,
  };
}

export async function createTestCaseAction(
  _previousState: TestCaseFormState,
  formData: FormData,
): Promise<TestCaseFormState> {
  const result = await runWorkspaceServerAction(
    {
      input: testCaseFormInputFromFormData("create", formData),
      permission: "assertion:edit",
      schema: testCaseFormActionSchema,
    },
    async ({ input, membership, user }) => {
      const supabase = await createSupabaseServerClient();

      if (!supabase) {
        throw serverActionError("Supabase is not configured for this environment.");
      }

      await requireWorkspaceAssertion(supabase, membership.workspace.id, input.assertionId);

      return createTestCase(supabase, membership.workspace.id, user.id, buildTestCaseInput(input, "draft"));
    },
  );

  const error = serverActionErrorState(result);

  if (error) {
    return { error };
  }

  revalidatePath("/assertions");
  revalidatePath(`/assertions/${String(formData.get("assertionId") ?? "")}`);
  return { success: "Test case created as a draft." };
}

export async function updateTestCaseAction(
  _previousState: TestCaseFormState,
  formData: FormData,
): Promise<TestCaseFormState> {
  const result = await runWorkspaceServerAction(
    {
      input: testCaseFormInputFromFormData("update", formData),
      permission: "assertion:edit",
      schema: testCaseFormActionSchema,
    },
    async ({ input, membership }) => {
      const supabase = await createSupabaseServerClient();

      if (!supabase) {
        throw serverActionError("Supabase is not configured for this environment.");
      }

      if (!input.testCaseId) {
        throw serverActionError("Test case id is required when updating a test case.", "validation");
      }

      await requireWorkspaceAssertion(supabase, membership.workspace.id, input.assertionId);
      await requireWorkspaceTestCase(supabase, membership.workspace.id, input.assertionId, input.testCaseId);

      return updateTestCase(supabase, membership.workspace.id, input.testCaseId, buildTestCaseUpdateInput(input));
    },
  );

  const error = serverActionErrorState(result);

  if (error) {
    return { error };
  }

  revalidatePath("/assertions");
  revalidatePath(`/assertions/${String(formData.get("assertionId") ?? "")}`);
  return { success: "Test case updated." };
}

export async function approveTestCaseAction(formData: FormData) {
  await runTestCaseLifecycleAction(formData, async (supabase, workspaceId, testCaseId, userId) => {
    await approveTestCase(supabase, workspaceId, testCaseId, userId);
  });
}

export async function disableTestCaseAction(formData: FormData) {
  await runTestCaseLifecycleAction(formData, async (supabase, workspaceId, testCaseId) => {
    await disableTestCase(supabase, workspaceId, testCaseId);
  });
}

export async function deleteTestCaseAction(formData: FormData) {
  await runTestCaseLifecycleAction(formData, async (supabase, workspaceId, testCaseId) => {
    await deleteTestCase(supabase, workspaceId, testCaseId);
  });
}

export async function generateSuggestedTestCasesAction(
  _previousState: TestCaseSuggestionState,
  formData: FormData,
): Promise<TestCaseSuggestionState> {
  const result = await runWorkspaceServerAction(
    {
      input: {
        assertionId: String(formData.get("assertionId") ?? ""),
        maxSuggestions: Number(formData.get("maxSuggestions") ?? 3),
      },
      permission: "assertion:edit",
      schema: testCaseSuggestionActionSchema,
    },
    async ({ input, membership, user }) => {
      const supabase = await createSupabaseServerClient();

      if (!supabase) {
        throw serverActionError("Supabase is not configured for this environment.");
      }

      const assertion = await requireWorkspaceAssertion(supabase, membership.workspace.id, input.assertionId);
      const [sourceLinks, workspaceSources, existingTestCases] = await Promise.all([
        listAssertionSourcesForAssertion(supabase, membership.workspace.id, input.assertionId),
        listSources(supabase, membership.workspace.id),
        listTestCasesForAssertion(supabase, membership.workspace.id, input.assertionId),
      ]);
      const linkedSourceIds = new Set(sourceLinks.map((link) => link.sourceId));
      const linkedSources = workspaceSources.filter((source) => linkedSourceIds.has(source.id));

      if (linkedSources.length === 0) {
        throw serverActionError("Link at least one source before generating test cases.", "validation");
      }

      const sourceContexts = await Promise.all(
        linkedSources.map<Promise<TestCaseSuggestionSourceContext>>(async (source) => {
          const chunks = await listSourceChunksPreview(supabase, membership.workspace.id, source.id, { limit: 4 });

          return {
            id: source.id,
            name: source.name,
            description: source.description,
            type: source.type,
            originUri: source.originUri,
            syncStatus: source.syncStatus,
            excerpts: chunks.map((chunk) => chunk.content),
          };
        }),
      );

      if (!sourceContexts.some((source) => source.excerpts.length > 0 || source.description || source.originUri)) {
        throw serverActionError("Linked sources do not have enough context for AI test case suggestions.", "validation");
      }

      let provider: ReturnType<typeof createOpenAITestCaseSuggestionProvider>;
      let suggestions: Awaited<ReturnType<typeof provider.generate>>;

      try {
        provider = createOpenAITestCaseSuggestionProvider();
        suggestions = await provider.generate({
          assertion,
          sources: sourceContexts,
          existingTestCases,
          maxSuggestions: input.maxSuggestions,
        });
      } catch (error) {
        if (error instanceof TestCaseSuggestionError) {
          throw serverActionError(error.message);
        }

        throw error;
      }

      const firstOrdinal = existingTestCases.reduce((maxOrdinal, testCase) => Math.max(maxOrdinal, testCase.ordinal + 1), 0);

      for (const [index, suggestion] of suggestions.entries()) {
        await createTestCase(supabase, membership.workspace.id, user.id, {
          assertionId: assertion.id,
          title: suggestion.title,
          type: suggestion.type,
          status: "draft",
          input: {
            text: suggestion.inputText,
            coverageNotes: suggestion.coverageNotes,
          },
          expectedResult: suggestion.expectedResult,
          ordinal: firstOrdinal + index,
          metadata: {
            generatedBy: "radar_ai_test_case_suggestion",
            model: provider.model,
            sourceIds: linkedSources.map((source) => source.id),
            coverageNotes: suggestion.coverageNotes,
          },
        });
      }

      return suggestions.length;
    },
  );

  const error = serverActionErrorState(result);

  if (error) {
    return { error };
  }

  revalidatePath("/assertions");
  revalidatePath(`/assertions/${String(formData.get("assertionId") ?? "")}`);
  const count = result.ok ? result.data : 0;
  return {
    success: count === 1 ? "1 draft test case generated." : `${count} draft test cases generated.`,
  };
}

export async function generateSuggestedAssertionDraftsAction(
  _previousState: AssertionSuggestionState,
  formData: FormData,
): Promise<AssertionSuggestionState> {
  const result = await runWorkspaceServerAction(
    {
      input: {
        sourceIds: formData.getAll("sourceIds").map(String),
        maxSuggestions: Number(formData.get("maxSuggestions") ?? 3),
      },
      permission: "assertion:create",
      schema: assertionSuggestionActionSchema,
    },
    async ({ input, membership, user }) => {
      const supabase = await createSupabaseServerClient();

      if (!supabase) {
        throw serverActionError("Supabase is not configured for this environment.");
      }

      const workspaceSources = await listSources(supabase, membership.workspace.id);
      const workspaceSourceIds = new Set(workspaceSources.map((source) => source.id));
      const invalidSourceId = input.sourceIds.find((sourceId) => !workspaceSourceIds.has(sourceId));

      if (invalidSourceId) {
        throw serverActionError("One or more selected sources are not available in this workspace.", "validation");
      }

      const selectedSources = workspaceSources.filter((source) => input.sourceIds.includes(source.id));
      const sourceContexts = await Promise.all(
        selectedSources.map<Promise<AssertionSuggestionSourceContext>>(async (source) => {
          const chunks = await listSourceChunksPreview(supabase, membership.workspace.id, source.id, { limit: 4 });

          return {
            id: source.id,
            name: source.name,
            description: source.description,
            type: source.type,
            originUri: source.originUri,
            syncStatus: source.syncStatus,
            excerpts: chunks.map((chunk) => chunk.content),
          };
        }),
      );

      if (!sourceContexts.some((source) => source.excerpts.length > 0 || source.description || source.originUri)) {
        throw serverActionError("Selected sources do not have enough extracted context for AI suggestions.", "validation");
      }

      let provider: ReturnType<typeof createOpenAIAssertionSuggestionProvider>;
      let suggestions: Awaited<ReturnType<typeof provider.generate>>;

      try {
        provider = createOpenAIAssertionSuggestionProvider();
        suggestions = await provider.generate({
          workspaceName: membership.workspace.name,
          sources: sourceContexts,
          maxSuggestions: input.maxSuggestions,
        });
      } catch (error) {
        if (error instanceof AssertionSuggestionError) {
          throw serverActionError(error.message);
        }

        throw error;
      }

      for (const suggestion of suggestions) {
        const sourceIds = suggestion.requiredSourceIds.filter((sourceId) => workspaceSourceIds.has(sourceId));
        const linkedSourceIds = sourceIds.length > 0 ? sourceIds : input.sourceIds;
        const assertion = await createAssertion(supabase, membership.workspace.id, user.id, {
          title: suggestion.title,
          purpose: suggestion.purpose,
          expectedBehavior: suggestion.expectedBehavior,
          category: suggestion.category,
          priority: suggestion.priority,
          runnerType: suggestion.runnerType,
          status: "draft",
          metadata: {
            generatedBy: "radar_ai_suggestion",
            model: provider.model,
            sourceIds: linkedSourceIds,
            reasoning: suggestion.reasoning,
          },
        });

        await replaceAssertionSourcesForAssertion(supabase, membership.workspace.id, assertion.id, linkedSourceIds);
        await upsertAssertionRunSchedule(supabase, membership.workspace.id, {
          assertionId: assertion.id,
          cadence: "manual",
          timezone: "UTC",
          sourceChangeTrigger: true,
          isEnabled: false,
          metadata: {
            generatedBy: "radar_ai_suggestion",
          },
        });
      }

      return suggestions.length;
    },
  );

  const error = serverActionErrorState(result);

  if (error) {
    return { error };
  }

  revalidatePath("/assertions");
  redirect("/assertions?status=draft");
}

function assertionFormInputFromFormData(mode: AssertionFormInput["mode"], formData: FormData) {
  return {
    mode,
    assertionId: String(formData.get("assertionId") ?? ""),
    title: String(formData.get("title") ?? ""),
    purpose: String(formData.get("purpose") ?? ""),
    expectedBehavior: String(formData.get("expectedBehavior") ?? ""),
    category: String(formData.get("category") ?? "custom"),
    priority: String(formData.get("priority") ?? "medium"),
    runnerType: String(formData.get("runnerType") ?? "knowledge"),
    status: String(formData.get("status") ?? "active"),
    ownerUserId: String(formData.get("ownerUserId") ?? ""),
    scheduleCadence: String(formData.get("scheduleCadence") ?? "manual"),
    scheduleEnabled: formData.get("scheduleEnabled") === "on",
    sourceChangeTrigger: formData.get("sourceChangeTrigger") === "on",
    timezone: String(formData.get("timezone") ?? "UTC"),
    sourceIds: formData.getAll("sourceIds").map(String),
  };
}

function testCaseFormInputFromFormData(mode: TestCaseFormInput["mode"], formData: FormData) {
  return {
    mode,
    assertionId: String(formData.get("assertionId") ?? ""),
    testCaseId: String(formData.get("testCaseId") ?? ""),
    title: String(formData.get("title") ?? ""),
    type: String(formData.get("type") ?? "customer_question"),
    inputText: String(formData.get("inputText") ?? ""),
    expectedResult: String(formData.get("expectedResult") ?? ""),
    ordinal: Number(formData.get("ordinal") ?? 0),
  };
}

function buildAssertionInput(input: AssertionFormInput): CreateAssertionInput {
  return {
    title: input.title,
    purpose: input.purpose,
    expectedBehavior: input.expectedBehavior,
    category: input.category,
    priority: input.priority,
    runnerType: input.runnerType,
    status: input.status,
    ownerUserId: input.ownerUserId,
    metadata: {
      formVersion: "rad-042",
    },
  };
}

function buildTestCaseInput(input: TestCaseFormInput, status: TestCaseInput["status"]): TestCaseInput {
  return {
    assertionId: input.assertionId,
    title: input.title,
    type: input.type,
    status,
    input: {
      text: input.inputText,
    },
    expectedResult: input.expectedResult,
    ordinal: input.ordinal,
    metadata: {
      formVersion: "rad-047",
    },
  };
}

function buildTestCaseUpdateInput(input: TestCaseFormInput): Partial<TestCaseInput> {
  return {
    title: input.title,
    type: input.type,
    input: {
      text: input.inputText,
    },
    expectedResult: input.expectedResult,
    ordinal: input.ordinal,
    metadata: {
      formVersion: "rad-047",
    },
  };
}

async function runTestCaseLifecycleAction(
  formData: FormData,
  handler: (
    supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
    workspaceId: string,
    testCaseId: string,
    userId: string,
  ) => Promise<void>,
) {
  const result = await runWorkspaceServerAction(
    {
      input: {
        assertionId: String(formData.get("assertionId") ?? ""),
        testCaseId: String(formData.get("testCaseId") ?? ""),
      },
      permission: "assertion:edit",
      schema: testCaseStatusActionSchema,
    },
    async ({ input, membership, user }) => {
      const supabase = await createSupabaseServerClient();

      if (!supabase) {
        throw serverActionError("Supabase is not configured for this environment.");
      }

      await requireWorkspaceAssertion(supabase, membership.workspace.id, input.assertionId);
      await requireWorkspaceTestCase(supabase, membership.workspace.id, input.assertionId, input.testCaseId);
      await handler(supabase, membership.workspace.id, input.testCaseId, user.id);
    },
  );

  const error = serverActionErrorState(result);

  if (error) {
    throw serverActionError(error);
  }

  revalidatePath("/assertions");
  revalidatePath(`/assertions/${String(formData.get("assertionId") ?? "")}`);
}

async function requireWorkspaceAssertion(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  workspaceId: string,
  assertionId: string,
) {
  const assertion = await getAssertionById(supabase, workspaceId, assertionId);

  if (!assertion) {
    throw serverActionError("Assertion not found in this workspace.", "validation");
  }

  return assertion;
}

async function requireWorkspaceTestCase(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  workspaceId: string,
  assertionId: string,
  testCaseId: string,
) {
  const testCase = await getTestCaseById(supabase, workspaceId, testCaseId);

  if (!testCase || testCase.assertionId !== assertionId) {
    throw serverActionError("Test case not found for this assertion.", "validation");
  }

  return testCase;
}

async function saveAssertionDetails(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  workspaceId: string,
  assertionId: string,
  input: AssertionFormInput,
) {
  await replaceAssertionSourcesForAssertion(supabase, workspaceId, assertionId, input.sourceIds);
  await upsertAssertionRunSchedule(supabase, workspaceId, {
    assertionId,
    cadence: input.scheduleCadence,
    timezone: input.timezone,
    sourceChangeTrigger: input.sourceChangeTrigger,
    isEnabled: input.scheduleEnabled,
    metadata: {
      formVersion: "rad-042",
    },
  });
}

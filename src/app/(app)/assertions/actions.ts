"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  assertionCategories,
  assertionPriorities,
  assertionScheduleCadences,
  assertionStatuses,
  runnerTypes,
  type CreateAssertionInput,
} from "@/lib/assertions/schema";
import {
  createAssertion,
  replaceAssertionSourcesForAssertion,
  updateAssertion,
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

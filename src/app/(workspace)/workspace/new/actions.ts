"use server";

import { redirect } from "next/navigation";

import {
  runAuthenticatedServerAction,
  serverActionError,
  serverActionErrorState,
} from "@/lib/server/guardrails";
import { createWorkspaceSchema } from "@/lib/workspaces/schema";
import { createWorkspaceForCurrentUser } from "@/lib/workspaces/server";

export type CreateWorkspaceFormState = {
  error?: string;
};

export async function createWorkspaceAction(
  _previousState: CreateWorkspaceFormState,
  formData: FormData,
): Promise<CreateWorkspaceFormState> {
  const result = await runAuthenticatedServerAction(
    {
      input: {
        name: String(formData.get("name") ?? ""),
      },
      schema: createWorkspaceSchema,
    },
    async ({ input }) => {
      const createResult = await createWorkspaceForCurrentUser(input);

      if (createResult.error) {
        throw serverActionError(createResult.error);
      }

      return createResult.workspace;
    },
  );

  const error = serverActionErrorState(result);

  if (error) {
    return { error };
  }

  redirect("/command-center");
}

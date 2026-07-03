"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createWorkspaceForCurrentUser } from "@/lib/workspaces/server";

export type CreateWorkspaceFormState = {
  error?: string;
};

export async function createWorkspaceAction(
  _previousState: CreateWorkspaceFormState,
  formData: FormData,
): Promise<CreateWorkspaceFormState> {
  const name = String(formData.get("name") ?? "");

  try {
    const result = await createWorkspaceForCurrentUser({ name });

    if (result.error) {
      return { error: result.error };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Enter a valid workspace name." };
    }

    return { error: "Radar could not create the workspace. Try again." };
  }

  redirect("/command-center");
}

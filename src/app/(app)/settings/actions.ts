"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { workspaceTeamVisibilities, type WorkspaceTeamVisibility } from "@/lib/workspaces/schema";
import { updateWorkspaceSettingsForCurrentUser } from "@/lib/workspaces/server";

export type WorkspaceSettingsFormState = {
  error?: string;
  success?: string;
};

export async function updateWorkspaceSettingsAction(
  _previousState: WorkspaceSettingsFormState,
  formData: FormData,
): Promise<WorkspaceSettingsFormState> {
  const teamVisibility = String(formData.get("teamVisibility") ?? "");
  const input = {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    teamVisibility: workspaceTeamVisibilities.includes(teamVisibility as WorkspaceTeamVisibility)
      ? (teamVisibility as WorkspaceTeamVisibility)
      : "private",
  };

  try {
    const result = await updateWorkspaceSettingsForCurrentUser(input);

    if (result.error) {
      return { error: result.error };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Enter valid workspace settings." };
    }

    return { error: "Radar could not update workspace settings. Try again." };
  }

  revalidatePath("/settings");

  return { success: "Workspace settings updated." };
}

"use server";

import { revalidatePath } from "next/cache";

import {
  runWorkspaceServerAction,
  serverActionError,
  serverActionErrorState,
} from "@/lib/server/guardrails";
import {
  updateWorkspaceSettingsSchema,
  workspaceTeamVisibilities,
  type WorkspaceTeamVisibility,
} from "@/lib/workspaces/schema";
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
    dataRetentionDays: String(formData.get("dataRetentionDays") ?? "180"),
  };

  const result = await runWorkspaceServerAction(
    {
      input,
      permission: "workspace:manage",
      schema: updateWorkspaceSettingsSchema,
    },
    async ({ input: parsedInput }) => {
      const updateResult = await updateWorkspaceSettingsForCurrentUser(parsedInput);

      if (updateResult.error) {
        throw serverActionError(updateResult.error);
      }

      return updateResult.workspace;
    },
  );

  const error = serverActionErrorState(result);

  if (error) {
    return { error };
  }

  revalidatePath("/settings");

  return { success: "Workspace settings updated." };
}

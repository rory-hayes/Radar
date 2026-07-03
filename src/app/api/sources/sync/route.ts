import { z } from "zod";

import { runWorkspaceApiHandler, serverActionError } from "@/lib/server/guardrails";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runSourceSyncJob, sourceSyncReasons } from "@/lib/sources/source-sync-jobs";

const sourceSyncRequestSchema = z.object({
  sourceId: z.uuid(),
  reason: z.enum(sourceSyncReasons).default("manual"),
  force: z.boolean().default(false),
});

export async function POST(request: Request) {
  return runWorkspaceApiHandler(
    request,
    {
      permission: "source:edit",
      schema: sourceSyncRequestSchema,
      successStatus: 202,
    },
    async ({ input, membership, user }) => {
      const supabase = await createSupabaseServerClient();

      if (!supabase) {
        throw serverActionError("Supabase is not configured for this environment.");
      }

      return runSourceSyncJob(supabase, {
        workspaceId: membership.workspace.id,
        sourceId: input.sourceId,
        reason: input.reason,
        requestedByUserId: user.id,
        force: input.force,
      });
    },
  );
}

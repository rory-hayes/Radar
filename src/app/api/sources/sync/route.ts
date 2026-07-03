import { z } from "zod";

import { checkAndRecordAbuseLimit } from "@/lib/abuse/enforcement";
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
      rateLimit: {
        eventType: "api_request",
        route: "/api/sources/sync",
      },
    },
    async ({ input, membership, user }) => {
      const supabase = await createSupabaseServerClient();

      if (!supabase) {
        throw serverActionError("Supabase is not configured for this environment.");
      }

      const limit = await checkAndRecordAbuseLimit({
        client: supabase,
        workspaceId: membership.workspace.id,
        userId: user.id,
        eventType: "source_sync",
        metadata: {
          sourceId: input.sourceId,
          reason: input.reason,
          route: "/api/sources/sync",
        },
      });

      if (!limit.allowed) {
        throw serverActionError(limit.message, "rate_limited");
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

import { sendWorkspaceSlackAlert } from "@/lib/notifications/slack-dispatcher";
import { slackAlertRequestSchema } from "@/lib/notifications/schema";
import { runWorkspaceApiHandler, serverActionError } from "@/lib/server/guardrails";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  return runWorkspaceApiHandler(
    request,
    {
      permission: "workspace:manage",
      schema: slackAlertRequestSchema,
      successStatus: 202,
      rateLimit: {
        eventType: "api_request",
        route: "/api/notifications/slack",
      },
    },
    async ({ input, membership }) => {
      const supabase = await createSupabaseServerClient();

      if (!supabase) {
        throw serverActionError("Supabase is not configured for this environment.");
      }

      return sendWorkspaceSlackAlert(supabase, {
        ...input,
        workspaceId: membership.workspace.id,
        workspaceName: membership.workspace.name,
      });
    },
  );
}

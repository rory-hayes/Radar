import { notificationEmailRequestSchema } from "@/lib/notifications/schema";
import { sendWorkspaceNotificationEmails } from "@/lib/notifications/dispatcher";
import { runWorkspaceApiHandler, serverActionError } from "@/lib/server/guardrails";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  return runWorkspaceApiHandler(
    request,
    {
      permission: "workspace:manage",
      schema: notificationEmailRequestSchema,
      successStatus: 202,
      rateLimit: {
        eventType: "api_request",
        route: "/api/notifications/email",
      },
    },
    async ({ input, membership }) => {
      const supabase = await createSupabaseServerClient();

      if (!supabase) {
        throw serverActionError("Supabase is not configured for this environment.");
      }

      return sendWorkspaceNotificationEmails(supabase, {
        ...input,
        workspaceId: membership.workspace.id,
        workspaceName: membership.workspace.name,
      });
    },
  );
}

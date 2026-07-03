import { z } from "zod";

import { EvidenceRetrievalError, retrieveEvidenceForAssertion } from "@/lib/evidence/retrieval";
import { runWorkspaceApiHandler, serverActionError } from "@/lib/server/guardrails";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const evidenceRetrievalRequestSchema = z.object({
  assertionId: z.uuid(),
  testCaseId: z.uuid().optional(),
  query: z.string().trim().min(3).max(4000),
  sourceIds: z.array(z.uuid()).max(20).optional(),
  limit: z.number().int().min(1).max(20).default(8),
});

export async function POST(request: Request) {
  return runWorkspaceApiHandler(
    request,
    {
      permission: "workspace:read",
      schema: evidenceRetrievalRequestSchema,
    },
    async ({ input, membership }) => {
      const supabase = await createSupabaseServerClient();

      if (!supabase) {
        throw serverActionError("Supabase is not configured for this environment.");
      }

      try {
        return await retrieveEvidenceForAssertion(supabase, {
          workspaceId: membership.workspace.id,
          assertionId: input.assertionId,
          testCaseId: input.testCaseId,
          query: input.query,
          sourceIds: input.sourceIds,
          limit: input.limit,
        });
      } catch (error) {
        if (error instanceof EvidenceRetrievalError) {
          throw serverActionError(error.message, "validation");
        }

        throw error;
      }
    },
  );
}

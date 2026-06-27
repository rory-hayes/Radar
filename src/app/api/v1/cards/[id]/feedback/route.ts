import { requireApiAuth, assertSessionAccess } from "@/lib/auth/api";
import { assertFound, json, jsonError, optionsResponse, readJson } from "@/lib/sessions/http";
import { addFeedback, getSession } from "@/lib/sessions/store";
import { feedbackRequestSchema } from "@/lib/sessions/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireApiAuth();
    const body = await readJson(request, feedbackRequestSchema);
    const { id } = await context.params;
    const session = assertFound(getSession(body.sessionId), "session_not_found", "Radar session was not found.");
    assertSessionAccess(session, auth);
    const feedback = assertFound(
      addFeedback({
        sessionId: body.sessionId,
        cardId: id,
        rating: body.rating,
        note: body.note,
      }),
      "card_not_found",
      "Guidance card was not found for this Radar session.",
    );

    return json(
      {
        ok: true,
        feedback,
      },
      { status: 201 },
      request,
    );
  } catch (error) {
    return jsonError(error, request);
  }
}

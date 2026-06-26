import { assertFound, json, jsonError, optionsResponse, readJson } from "@/lib/sessions/http";
import { addFeedback } from "@/lib/sessions/store";
import { feedbackRequestSchema } from "@/lib/sessions/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const body = await readJson(request, feedbackRequestSchema);
    const { id } = await context.params;
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
    );
  } catch (error) {
    return jsonError(error);
  }
}

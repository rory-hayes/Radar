import { assertFound, json, jsonError, optionsResponse, readJson } from "@/lib/sessions/http";
import { addSegment, createLocalTestCard, getSession } from "@/lib/sessions/store";
import { segmentRequestSchema } from "@/lib/sessions/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const body = await readJson(request, segmentRequestSchema);
    const { id } = await context.params;
    const session = assertFound(getSession(id), "session_not_found", "Radar session was not found.");

    if (session.status === "ended") {
      return json(
        {
          ok: false,
          error: {
            code: "session_ended",
            message: "Transcript segments cannot be appended to an ended Radar session.",
          },
        },
        { status: 409 },
      );
    }

    const segment = addSegment({
      sessionId: id,
      text: body.text,
      source: body.source,
      isFinal: body.isFinal,
      startedAtMs: body.startedAtMs,
      endedAtMs: body.endedAtMs,
    });

    const localCard =
      body.localTest?.enabled === true && process.env.RADAR_ENABLE_LOCAL_TEST_HELPERS === "true"
        ? createLocalTestCard(segment)
        : undefined;

    return json(
      {
        ok: true,
        segment,
        localTest: {
          requested: body.localTest?.enabled === true,
          enabled: process.env.RADAR_ENABLE_LOCAL_TEST_HELPERS === "true",
          card: localCard,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}

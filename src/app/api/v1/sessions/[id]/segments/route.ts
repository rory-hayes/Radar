import { requireApiAuth, assertSessionAccess } from "@/lib/auth/api";
import { buildGuidanceForSegment } from "@/lib/knowledge/store";
import { assertFound, json, jsonError, optionsResponse, readJson } from "@/lib/sessions/http";
import { addCard, addSegment, createLocalTestCard, getSession } from "@/lib/sessions/store";
import { segmentRequestSchema } from "@/lib/sessions/validation";
import { getDefaultWorkspaceId } from "@/lib/supabase/server";

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
    const body = await readJson(request, segmentRequestSchema);
    const { id } = await context.params;
    const session = assertFound(await getSession(id), "session_not_found", "Radar session was not found.");
    assertSessionAccess(session, auth);

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
        request,
      );
    }

    const segment = await addSegment({
      sessionId: id,
      text: body.text,
      source: body.source,
      isFinal: body.isFinal,
      startedAtMs: body.startedAtMs,
      endedAtMs: body.endedAtMs,
    });

    const guidanceCard = body.isFinal
      ? await addCard(
          await buildGuidanceForSegment({
            workspaceId: session.workspaceId ?? getDefaultWorkspaceId(),
            sessionId: id,
            segment,
          }),
        )
      : undefined;

    const localCard =
      body.localTest?.enabled === true && process.env.RADAR_ENABLE_LOCAL_TEST_HELPERS === "true"
        ? await createLocalTestCard(segment)
        : undefined;

    return json(
      {
        ok: true,
        segment,
        guidance: {
          card: guidanceCard,
        },
        localTest: {
          requested: body.localTest?.enabled === true,
          enabled: process.env.RADAR_ENABLE_LOCAL_TEST_HELPERS === "true",
          card: localCard,
        },
      },
      { status: 201 },
      request,
    );
  } catch (error) {
    return jsonError(error, request);
  }
}

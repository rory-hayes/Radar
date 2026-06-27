import { requireApiAuth, assertSessionAccess } from "@/lib/auth/api";
import { assertFound, corsHeaders, json, jsonError, optionsResponse, parseAfterCursor } from "@/lib/sessions/http";
import { getSession, listEvents } from "@/lib/sessions/store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await requireApiAuth();
    const { id } = await context.params;
    const session = assertFound(await getSession(id), "session_not_found", "Radar session was not found.");
    assertSessionAccess(session, auth);
    const after = parseAfterCursor(request.url);
    const events = await listEvents(id, after);
    const cursor = events.at(-1)?.sequence ?? after;

    if (request.headers.get("accept")?.includes("text/event-stream")) {
      const body = events
        .map((event) => `id: ${event.sequence}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
        .join("");

      return new Response(body, {
        headers: {
          ...corsHeaders(request),
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-store",
          Connection: "keep-alive",
        },
      });
    }

    return json({
      ok: true,
      session: {
        id: session.id,
        status: session.status,
      },
      events,
      cursor,
    }, undefined, request);
  } catch (error) {
    return jsonError(error, request);
  }
}

import { assertFound, corsHeaders, json, jsonError, optionsResponse, parseAfterCursor } from "@/lib/sessions/http";
import { getSession, listEvents } from "@/lib/sessions/store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = assertFound(getSession(id), "session_not_found", "Radar session was not found.");
    const after = parseAfterCursor(request.url);
    const events = listEvents(id, after);
    const cursor = events.at(-1)?.sequence ?? after;

    if (request.headers.get("accept")?.includes("text/event-stream")) {
      const body = events
        .map((event) => `id: ${event.sequence}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
        .join("");

      return new Response(body, {
        headers: {
          ...corsHeaders,
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
    });
  } catch (error) {
    return jsonError(error);
  }
}

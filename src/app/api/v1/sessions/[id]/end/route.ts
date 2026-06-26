import { assertFound, json, jsonError, optionsResponse, readJson } from "@/lib/sessions/http";
import { getSession, setSessionStatus } from "@/lib/sessions/store";
import { endSessionRequestSchema } from "@/lib/sessions/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request, context: RouteContext) {
  try {
    await readJson(request, endSessionRequestSchema);
    const { id } = await context.params;
    assertFound(getSession(id), "session_not_found", "Radar session was not found.");
    const session = assertFound(setSessionStatus(id, "ended"), "session_not_found", "Radar session was not found.");

    return json({
      ok: true,
      session,
    });
  } catch (error) {
    return jsonError(error);
  }
}

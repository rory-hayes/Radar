import { requireApiAuth, assertSessionAccess } from "@/lib/auth/api";
import { assertFound, json, jsonError, optionsResponse, readJson } from "@/lib/sessions/http";
import { getSession, setSessionStatus } from "@/lib/sessions/store";
import { endSessionRequestSchema } from "@/lib/sessions/validation";

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
    await readJson(request, endSessionRequestSchema);
    const { id } = await context.params;
    const existingSession = assertFound(await getSession(id), "session_not_found", "Radar session was not found.");
    assertSessionAccess(existingSession, auth);
    const session = assertFound(await setSessionStatus(id, "ended"), "session_not_found", "Radar session was not found.");

    return json({
      ok: true,
      session,
    }, undefined, request);
  } catch (error) {
    return jsonError(error, request);
  }
}

import { mintRealtimeClientSecret } from "@/lib/realtime/openai";
import { assertFound, json, jsonError, optionsResponse, readJson } from "@/lib/sessions/http";
import { addRealtimeEvent, getSession } from "@/lib/sessions/store";
import { clientSecretRequestSchema } from "@/lib/sessions/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request, context: RouteContext) {
  try {
    await readJson(request, clientSecretRequestSchema);
    const { id } = await context.params;
    assertFound(getSession(id), "session_not_found", "Radar session was not found.");

    const result = await mintRealtimeClientSecret();
    addRealtimeEvent(id, {
      state: result.state,
      model: result.model,
      expiresAt: result.state === "ready" ? result.expiresAt : undefined,
    });

    if (result.state === "not_configured") {
      return json({
        ok: true,
        state: "not_configured",
        realtime: {
          model: result.model,
          reason: result.reason,
        },
      });
    }

    return json({
      ok: true,
      state: "ready",
      realtime: {
        model: result.model,
        expiresAt: result.expiresAt,
        clientSecret: result.clientSecret,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}

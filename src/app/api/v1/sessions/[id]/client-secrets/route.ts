import { requireApiAuth, assertSessionAccess } from "@/lib/auth/api";
import { mintRealtimeClientSecret } from "@/lib/realtime/openai";
import { ApiError, assertFound, json, jsonError, optionsResponse, readJson } from "@/lib/sessions/http";
import { addRealtimeEvent, getSession } from "@/lib/sessions/store";
import { clientSecretRequestSchema } from "@/lib/sessions/validation";
import { consumeRateLimit, rateLimitIdentity } from "@/lib/security/rate-limit";

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
    const rateLimit = consumeRateLimit({
      key: rateLimitIdentity(request, "v1:realtime:client-secret", auth.email),
      windowMs: 60_000,
      max: 20,
    });

    if (!rateLimit.allowed) {
      throw new ApiError(429, "rate_limited", "Too many Realtime credential requests. Try again shortly.");
    }

    await readJson(request, clientSecretRequestSchema);
    const { id } = await context.params;
    const session = assertFound(getSession(id), "session_not_found", "Radar session was not found.");
    assertSessionAccess(session, auth);

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
      }, undefined, request);
    }

    return json({
      ok: true,
      state: "ready",
      realtime: {
        model: result.model,
        expiresAt: result.expiresAt,
        clientSecret: result.clientSecret,
      },
    }, undefined, request);
  } catch (error) {
    return jsonError(error, request);
  }
}

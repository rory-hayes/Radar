import { requireApiAuth } from "@/lib/auth/api";
import { ApiError, json, jsonError, optionsResponse, readJson } from "@/lib/sessions/http";
import { createSession } from "@/lib/sessions/store";
import { createSessionRequestSchema } from "@/lib/sessions/validation";
import { consumeRateLimit, rateLimitIdentity } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth();
    const rateLimit = consumeRateLimit({
      key: rateLimitIdentity(request, "v1:sessions:create", auth.email),
      windowMs: 60_000,
      max: 20,
    });

    if (!rateLimit.allowed) {
      throw new ApiError(429, "rate_limited", "Too many Radar sessions were started. Try again shortly.");
    }

    const body = await readJson(request, createSessionRequestSchema);
    const session = await createSession({
      createdByEmail: auth.email,
      workspaceId: body.workspaceId,
      tab: body.tab,
      capture: body.capture,
      consent: body.consent,
      client: body.client,
    });

    return json(
      {
        ok: true,
        session,
      },
      { status: 201 },
      request,
    );
  } catch (error) {
    return jsonError(error, request);
  }
}

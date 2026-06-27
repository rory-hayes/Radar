import { NextResponse } from "next/server";

import {
  authenticateSupabaseAccessToken,
  setAuthSessionCookie,
} from "@/lib/auth/session";
import { consumeRateLimit, rateLimitIdentity } from "@/lib/security/rate-limit";
import { AcceptInviteSchema } from "@/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit({
    key: rateLimitIdentity(request, "auth:accept-invite"),
    windowMs: 60_000,
    max: 10,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "rate_limited",
          message: "Too many invite attempts. Try again shortly.",
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = AcceptInviteSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "invalid_request",
          message: "Open the invite link from your email again.",
          details: parsed.error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  const result = await authenticateSupabaseAccessToken(parsed.data.accessToken);

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: result.code,
          message: result.message,
        },
      },
      { status: result.status },
    );
  }

  await setAuthSessionCookie(result.token, result.maxAge);

  return NextResponse.json({
    ok: true,
    session: {
      email: result.session.email,
      expiresAt: result.session.expiresAt,
      mode: result.session.mode,
    },
    next: "/app?onboarding=user",
  });
}

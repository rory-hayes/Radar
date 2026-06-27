import { NextResponse } from "next/server";

import { authenticatePassword, setAuthSessionCookie } from "@/lib/auth/session";
import { consumeRateLimit, rateLimitIdentity } from "@/lib/security/rate-limit";
import { SignInSchema } from "@/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit({
    key: rateLimitIdentity(request, "auth:sign-in"),
    windowMs: 60_000,
    max: 10,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "rate_limited",
          message: "Too many sign-in attempts. Try again shortly.",
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
  const parsed = SignInSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "invalid_request",
          message: "Enter a valid email and password.",
          details: parsed.error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  const result = await authenticatePassword(parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: result.code,
          message: result.message,
          missing: "missing" in result ? result.missing : undefined,
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
  });
}

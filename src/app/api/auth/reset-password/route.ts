import { NextResponse } from "next/server";

import {
  authenticateSupabaseAccessToken,
  setAuthSessionCookie,
} from "@/lib/auth/session";
import { consumeRateLimit, rateLimitIdentity } from "@/lib/security/rate-limit";
import { getSupabaseAuthClient } from "@/lib/supabase/server";
import { ResetPasswordSchema } from "@/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit({
    key: rateLimitIdentity(request, "auth:reset-password"),
    windowMs: 60_000,
    max: 5,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "rate_limited",
          message: "Too many password reset attempts. Try again shortly.",
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
  const parsed = ResetPasswordSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "invalid_request",
          message: "Enter and confirm a new password.",
          details: parsed.error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAuthClient();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "supabase_not_configured",
          message: "Password recovery is not configured for this environment.",
        },
      },
      { status: 503 },
    );
  }

  const { accessToken, refreshToken, password } = parsed.data;
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "invalid_recovery_link",
          message: "This password reset link is invalid or expired. Request a new reset link.",
        },
      },
      { status: 401 },
    );
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });

  if (updateError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "password_update_failed",
          message: updateError.message || "Radar could not update this password.",
        },
      },
      { status: 400 },
    );
  }

  const sessionResult = await authenticateSupabaseAccessToken(accessToken);

  if (sessionResult.ok) {
    await setAuthSessionCookie(sessionResult.token, sessionResult.maxAge);

    return NextResponse.json({
      ok: true,
      next: "/app?onboarding=user",
    });
  }

  return NextResponse.json({
    ok: true,
    next: "/auth/sign-in?from=recovery-complete",
  });
}

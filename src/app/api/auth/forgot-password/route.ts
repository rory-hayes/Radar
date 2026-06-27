import { NextResponse } from "next/server";

import { consumeRateLimit, rateLimitIdentity } from "@/lib/security/rate-limit";
import { sendPasswordResetEmail } from "@/lib/workspace/store";
import { ForgotPasswordSchema } from "@/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit({
    key: rateLimitIdentity(request, "auth:forgot-password"),
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
  const parsed = ForgotPasswordSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "invalid_request",
          message: "Enter a valid email address.",
          details: parsed.error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  await sendPasswordResetEmail(parsed.data.email).catch(() => undefined);

  return NextResponse.json({
    ok: true,
    message: "If that email has Radar access, a reset link has been sent.",
  });
}

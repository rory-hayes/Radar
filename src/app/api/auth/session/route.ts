import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAuthSession();

  return NextResponse.json({
    ok: true,
    authenticated: Boolean(session),
    session: session
      ? {
          email: session.email,
          expiresAt: session.expiresAt,
          mode: session.mode,
        }
      : null,
  });
}

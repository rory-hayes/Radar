import { NextResponse } from "next/server";

import { clearAuthSessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST() {
  await clearAuthSessionCookie();
  return NextResponse.json({ ok: true });
}

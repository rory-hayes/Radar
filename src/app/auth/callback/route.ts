import { NextResponse, type NextRequest } from "next/server";

import { recordAuditEvent } from "@/lib/audit/server";
import { normalizeAuthRedirectPath } from "@/lib/auth/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = normalizeAuthRedirectPath(requestUrl.searchParams.get("next"));
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return redirectToSignIn(requestUrl, nextPath, "Authentication is not configured for this environment.");
  }

  if (!code) {
    return redirectToSignIn(requestUrl, nextPath, "The authentication callback was missing its verification code.");
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectToSignIn(requestUrl, nextPath, error.message);
  }

  await recordAuditEvent({
    action: "auth.signed_in",
    resourceType: "auth_session",
  });

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}

function redirectToSignIn(requestUrl: URL, nextPath: string, error: string) {
  const redirectUrl = new URL("/sign-in", requestUrl.origin);
  redirectUrl.searchParams.set("next", nextPath);
  redirectUrl.searchParams.set("error", error);

  return NextResponse.redirect(redirectUrl);
}

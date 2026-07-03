import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { isAuthRoute, isProtectedAppPath, normalizeAuthRedirectPath } from "@/lib/auth/redirects";

export async function updateSession(request: NextRequest) {
  const config = getSupabasePublicConfig();
  const pathname = request.nextUrl.pathname;
  const isProtectedPath = isProtectedAppPath(pathname);
  let response = NextResponse.next({
    request,
  });

  if (!config) {
    return isProtectedPath ? redirectToSignIn(request) : response;
  }

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const isAuthenticated = !error && Boolean(claims?.sub);

  if (isProtectedPath && !isAuthenticated) {
    return redirectToSignIn(request);
  }

  if (isAuthRoute(pathname) && isAuthenticated) {
    const nextPath = normalizeAuthRedirectPath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(nextPath, request.url));
  }

  return response;
}

function redirectToSignIn(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/sign-in";
  redirectUrl.search = "";
  redirectUrl.searchParams.set("next", normalizeAuthRedirectPath(`${request.nextUrl.pathname}${request.nextUrl.search}`));

  return NextResponse.redirect(redirectUrl);
}

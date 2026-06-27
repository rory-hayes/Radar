import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (request.cookies.has(AUTH_COOKIE_NAME)) {
    return NextResponse.next();
  }

  const signInUrl = request.nextUrl.clone();
  signInUrl.pathname = "/auth/sign-in";
  signInUrl.search = "";
  signInUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ["/app/:path*"],
};

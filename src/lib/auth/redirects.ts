import { appRoutes } from "@/lib/radar-routes";

const authRoutes = ["/sign-in", "/sign-up"] as const;
const protectedAppPaths = [...appRoutes.map((route) => route.href), "/workspace"] as const;

export const defaultAuthenticatedPath = "/command-center";

export function normalizeAuthRedirectPath(value: string | null | undefined) {
  if (!value?.startsWith("/")) {
    return defaultAuthenticatedPath;
  }

  if (value.startsWith("//") || value.includes("://")) {
    return defaultAuthenticatedPath;
  }

  return value;
}

export function isAuthRoute(pathname: string) {
  return authRoutes.some((route) => pathname === route);
}

export function isProtectedAppPath(pathname: string) {
  return protectedAppPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

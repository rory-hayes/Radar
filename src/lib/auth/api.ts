import "server-only";

import { ApiError } from "@/lib/sessions/http";
import type { RadarSession } from "@/lib/sessions/types";

import { getAuthSession, type AuthSession } from "./session";

export async function requireApiAuth() {
  const session = await getAuthSession();

  if (!session) {
    throw new ApiError(401, "unauthenticated", "Sign in to Radar before using this API.");
  }

  return session;
}

export function assertSessionAccess(radarSession: RadarSession, authSession: AuthSession) {
  if (radarSession.createdByEmail !== authSession.email) {
    throw new ApiError(403, "forbidden", "This Radar session belongs to another signed-in user.");
  }
}

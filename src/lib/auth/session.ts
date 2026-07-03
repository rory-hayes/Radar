import { redirect } from "next/navigation";

import { defaultAuthenticatedPath } from "@/lib/auth/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RadarAuthenticatedUser = {
  id: string;
  email?: string;
};

export async function getAuthenticatedUser(): Promise<RadarAuthenticatedUser | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub) {
    return null;
  }

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : undefined,
  };
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(defaultAuthenticatedPath)}`);
  }

  return user;
}

import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupabaseRuntimeState =
  | {
      state: "ready";
      url: string;
      hasSecretKey: true;
      hasPublishableKey: boolean;
    }
  | {
      state: "not_configured";
      missing: string[];
    };

function supabaseUrl() {
  return process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
}

function supabaseSecretKey() {
  return process.env.SUPABASE_SECRET_KEY?.trim();
}

function supabasePublishableKey() {
  return process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
}

export function getSupabaseRuntimeState(): SupabaseRuntimeState {
  const url = supabaseUrl();
  const secretKey = supabaseSecretKey();
  const missing = [
    !url ? "SUPABASE_URL" : null,
    !secretKey ? "SUPABASE_SECRET_KEY" : null,
  ].filter(Boolean) as string[];

  if (!url || !secretKey || missing.length > 0) {
    return {
      state: "not_configured",
      missing,
    };
  }

  return {
    state: "ready",
    url,
    hasSecretKey: true,
    hasPublishableKey: Boolean(supabasePublishableKey()),
  };
}

export function getSupabaseAdminClient(): SupabaseClient {
  const state = getSupabaseRuntimeState();

  if (state.state !== "ready") {
    throw new Error(`Supabase is not configured: ${state.missing.join(", ")}`);
  }

  return createClient(state.url, supabaseSecretKey()!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getSupabaseAuthClient(): SupabaseClient | null {
  const url = supabaseUrl();
  const key = supabasePublishableKey();

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getDefaultWorkspaceId() {
  return process.env.RADAR_DEFAULT_WORKSPACE_ID?.trim() || "radar";
}

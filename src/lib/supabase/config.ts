export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

export function getSupabasePublicConfig(env: NodeJS.ProcessEnv = process.env): SupabasePublicConfig | null {
  const url = normalizeEnvValue(env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey =
    normalizeEnvValue(env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
    normalizeEnvValue(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured(env: NodeJS.ProcessEnv = process.env) {
  return getSupabasePublicConfig(env) !== null;
}

function normalizeEnvValue(value: string | undefined) {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : undefined;
}

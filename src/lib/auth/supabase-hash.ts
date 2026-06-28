export function normalizeSupabaseAuthHash(hash: string) {
  return hash.replaceAll("&amp;", "&").replaceAll("&#38;", "&");
}

export function getSupabaseAuthHashParams(hash: string) {
  return new URLSearchParams(normalizeSupabaseAuthHash(hash).replace(/^#/, ""));
}

export function inferSupabaseAuthType(hash: string) {
  const normalizedHash = normalizeSupabaseAuthHash(hash);

  if (/(^|[&#?])type=invite(&|$)/.test(normalizedHash)) {
    return "invite";
  }

  if (/(^|[&#?])type=recovery(&|$)/.test(normalizedHash)) {
    return "recovery";
  }

  return null;
}

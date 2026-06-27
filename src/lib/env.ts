export function readEnv(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed || trimmed === "\"\"" || trimmed === "''") {
    return undefined;
  }

  return trimmed;
}

const REDACTED = "[redacted]";

const SENSITIVE_KEY_PATTERN =
  /(authorization|api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|cookie|password|secret|credential)/i;

const SENSITIVE_VALUE_PATTERNS = [
  /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}\b/g,
  /\bsk-(?:proj|svcacct|admin)?-[A-Za-z0-9_-]{20,}\b/g,
  /\b[A-Za-z0-9_-]{32,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/g,
];

export function redactString(value: string): string {
  return SENSITIVE_VALUE_PATTERNS.reduce(
    (result, pattern) => result.replace(pattern, REDACTED),
    value,
  );
}

export function redactForLog(input: unknown): unknown {
  if (typeof input === "string") {
    return redactString(input);
  }

  if (
    input === null ||
    typeof input === "undefined" ||
    typeof input === "number" ||
    typeof input === "boolean"
  ) {
    return input;
  }

  if (input instanceof Date) {
    return input.toISOString();
  }

  if (Array.isArray(input)) {
    return input.map((item) => redactForLog(item));
  }

  if (typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input as Record<string, unknown>).map(([key, value]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : redactForLog(value),
      ]),
    );
  }

  return REDACTED;
}

export function safeLogFields(fields: Record<string, unknown>) {
  return redactForLog(fields) as Record<string, unknown>;
}

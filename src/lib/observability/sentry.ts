type MutableEvent = {
  user?: Record<string, unknown>;
  request?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  contexts?: Record<string, unknown>;
  tags?: Record<string, string>;
  breadcrumbs?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

type MutableBreadcrumb = Record<string, unknown>;

export const radarSentryRelease =
  normalizeEnvValue(process.env.SENTRY_RELEASE)
  ?? normalizeEnvValue(process.env.VERCEL_GIT_COMMIT_SHA)
  ?? normalizeEnvValue(process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA);

export const radarSentryEnvironment =
  normalizeEnvValue(process.env.NEXT_PUBLIC_RADAR_ENV)
  ?? normalizeEnvValue(process.env.RADAR_ENV)
  ?? normalizeEnvValue(process.env.VERCEL_ENV)
  ?? normalizeEnvValue(process.env.NODE_ENV)
  ?? "local";

const redactedValue = "[Filtered]";
const sensitiveKeyPattern =
  /authorization|cookie|password|secret|token|api[-_]?key|source|content|chunk|embedding|evidence|prompt|completion|raw|body/i;

export function buildRadarSentryOptions(runtime: "client" | "server" | "edge") {
  return {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
    environment: radarSentryEnvironment,
    release: radarSentryRelease,
    sendDefaultPii: false,
    skipOpenTelemetrySetup: runtime !== "client",
    tracesSampleRate: runtime === "client" ? 0.05 : 0.1,
    beforeSend: scrubSentryEvent,
    beforeBreadcrumb: scrubSentryBreadcrumb,
    initialScope: {
      tags: {
        app: "radar",
        runtime,
      },
    },
  };
}

export function scrubSentryEvent(event: MutableEvent) {
  if (event.user) {
    event.user = sanitizeObject(event.user, { preserveKeys: new Set(["id"]) });
  }

  if (event.request) {
    event.request = sanitizeObject(event.request);
  }

  if (event.extra) {
    event.extra = sanitizeObject(event.extra);
  }

  if (event.contexts) {
    event.contexts = sanitizeObject(event.contexts, { preserveKeys: new Set(["trace"]) });
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => scrubSentryBreadcrumb(breadcrumb) ?? breadcrumb);
  }

  event.tags = {
    ...event.tags,
    radar_privacy: "source_content_filtered",
  };

  return event;
}

export function scrubSentryBreadcrumb(breadcrumb: MutableBreadcrumb | null) {
  if (!breadcrumb) {
    return breadcrumb;
  }

  return sanitizeObject(breadcrumb);
}

function sanitizeObject<T extends Record<string, unknown>>(
  value: T,
  options: { preserveKeys?: ReadonlySet<string> } = {},
): T {
  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => {
      if (!options.preserveKeys?.has(key) && sensitiveKeyPattern.test(key)) {
        return [key, redactedValue];
      }

      if (Array.isArray(entryValue)) {
        return [key, entryValue.map((item) => sanitizeUnknown(item))];
      }

      if (entryValue && typeof entryValue === "object") {
        return [key, sanitizeObject(entryValue as Record<string, unknown>, options)];
      }

      if (typeof entryValue === "string" && sensitiveKeyPattern.test(entryValue)) {
        return [key, redactedValue];
      }

      return [key, entryValue];
    }),
  ) as T;
}

function sanitizeUnknown(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeUnknown(item));
  }

  if (value && typeof value === "object") {
    return sanitizeObject(value as Record<string, unknown>);
  }

  return value;
}

function normalizeEnvValue(value: string | undefined) {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
}

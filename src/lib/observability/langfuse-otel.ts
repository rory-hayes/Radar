import { LangfuseSpanProcessor } from "@langfuse/otel";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

import { radarSentryEnvironment, radarSentryRelease } from "@/lib/observability/sentry";

let langfuseProvider: NodeTracerProvider | undefined;

export function registerLangfuseTracing() {
  if (langfuseProvider || !isLangfuseTracingConfigured()) {
    return;
  }

  langfuseProvider = new NodeTracerProvider({
    spanProcessors: [
      new LangfuseSpanProcessor({
        publicKey: process.env.LANGFUSE_PUBLIC_KEY,
        secretKey: process.env.LANGFUSE_SECRET_KEY,
        baseUrl: normalizeEnvValue(process.env.LANGFUSE_BASE_URL) ?? "https://cloud.langfuse.com",
        environment: radarSentryEnvironment,
        release: radarSentryRelease,
        exportMode: process.env.VERCEL ? "immediate" : "batched",
        mask: ({ data }) => sanitizeLangfuseData(data),
        shouldExportSpan: ({ otelSpan }) => otelSpan.name.startsWith("radar.llm."),
      }),
    ],
  });

  langfuseProvider.register();
}

export function isLangfuseTracingConfigured() {
  return Boolean(normalizeEnvValue(process.env.LANGFUSE_PUBLIC_KEY) && normalizeEnvValue(process.env.LANGFUSE_SECRET_KEY));
}

export function sanitizeLangfuseData(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLangfuseData(item));
  }

  if (!value || typeof value !== "object") {
    return typeof value === "string" && sensitiveValuePattern.test(value) ? "[Filtered]" : value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => {
      if (safeLangfuseMetadataKeys.has(key)) {
        return [key, sanitizeLangfuseData(entryValue)];
      }

      if ((key === "input" || key === "output") && isSafeTraceIo(entryValue)) {
        return [key, sanitizeLangfuseData(entryValue)];
      }

      if (sensitiveKeyPattern.test(key)) {
        return [key, "[Filtered]"];
      }

      return [key, sanitizeLangfuseData(entryValue)];
    }),
  );
}

const safeLangfuseMetadataKeys = new Set([
  "app",
  "costTracking",
  "environment",
  "failureType",
  "inputFingerprint",
  "latencyMs",
  "model",
  "observationId",
  "outputFingerprint",
  "promptId",
  "promptVersion",
  "provider",
  "release",
  "responseFormat",
  "status",
  "task",
  "totalTokens",
  "traceId",
  "traceStatus",
  "usageDetails",
]);

const sensitiveKeyPattern =
  /authorization|cookie|password|secret|token|api[-_]?key|source|content|chunk|embedding|evidence|prompt|completion|raw|body/i;
const sensitiveValuePattern = /authorization|bearer |password|secret|api[-_]?key|source|evidence|prompt|completion/i;

function isSafeTraceIo(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.keys(value).every((key) => safeLangfuseMetadataKeys.has(key));
}

function normalizeEnvValue(value: string | undefined) {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
}

#!/usr/bin/env node

import { z } from "zod";

const radarEnvironments = ["local", "preview", "staging", "production", "test"];
const strictRadarEnvironments = ["preview", "staging", "production"];
const requiredPublicEnvKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_POSTHOG_KEY",
  "NEXT_PUBLIC_SENTRY_DSN",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
];
const requiredServerEnvKeys = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "TRIGGER_SECRET_KEY",
  "RESEND_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SENTRY_AUTH_TOKEN",
];

const optionalText = z.preprocess((value) => normalizeEnvValue(value), z.string().min(1).optional());
const optionalUrl = z.preprocess((value) => normalizeEnvValue(value), z.string().url().optional());
const envSchema = z.object({
  RADAR_ENV: z.enum(radarEnvironments).optional(),
  NEXT_PUBLIC_RADAR_ENV: z.enum(radarEnvironments).optional(),
  VERCEL_ENV: optionalText,
  NODE_ENV: optionalText,
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalText,
  NEXT_PUBLIC_POSTHOG_KEY: optionalText,
  NEXT_PUBLIC_POSTHOG_HOST: optionalUrl,
  NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optionalText,
  SUPABASE_SERVICE_ROLE_KEY: optionalText,
  OPENAI_API_KEY: optionalText,
  TRIGGER_SECRET_KEY: optionalText,
  RESEND_API_KEY: optionalText,
  RESEND_FROM_EMAIL: optionalText,
  SLACK_WEBHOOK_URL: optionalUrl,
  RADAR_APP_URL: optionalUrl,
  STRIPE_SECRET_KEY: optionalText,
  STRIPE_WEBHOOK_SECRET: optionalText,
  STRIPE_PRICE_ID_STARTER: optionalText,
  SENTRY_AUTH_TOKEN: optionalText,
  SENTRY_ORG: optionalText,
  SENTRY_PROJECT: optionalText,
  SENTRY_RELEASE: optionalText,
  LANGFUSE_PUBLIC_KEY: optionalText,
  LANGFUSE_SECRET_KEY: optionalText,
  LANGFUSE_BASE_URL: optionalUrl,
});

const result = validate(process.env);

if (!result.ok) {
  console.error(result.message);
  process.exit(1);
}

console.log(`Radar environment validation passed for ${result.environment}.`);

function validate(rawEnv) {
  const environment = resolveRadarEnvironment(rawEnv);
  const parsed = envSchema.safeParse(rawEnv);
  const invalid = parsed.success ? [] : parsed.error.issues.map((issue) => issue.path.join(".")).filter(Boolean);
  const missing = strictRadarEnvironments.includes(environment)
    ? [...requiredPublicEnvKeys, ...requiredServerEnvKeys].filter((key) => !normalizeEnvValue(rawEnv[key]))
    : [];

  if (invalid.length > 0 || missing.length > 0) {
    return {
      ok: false,
      environment,
      message: formatEnvErrorMessage(environment, missing, invalid),
    };
  }

  return { ok: true, environment };
}

function resolveRadarEnvironment(env) {
  const explicitEnv = normalizeEnvValue(env.RADAR_ENV) ?? normalizeEnvValue(env.NEXT_PUBLIC_RADAR_ENV);

  if (radarEnvironments.includes(explicitEnv)) {
    return explicitEnv;
  }

  if (env.VERCEL_ENV === "production") {
    return "production";
  }

  if (env.VERCEL_ENV === "preview") {
    return "preview";
  }

  if (env.NODE_ENV === "test") {
    return "test";
  }

  return "local";
}

function formatEnvErrorMessage(environment, missing, invalid) {
  const details = [
    missing.length > 0 ? `missing required variables: ${missing.join(", ")}` : undefined,
    invalid.length > 0 ? `invalid variables: ${invalid.join(", ")}` : undefined,
  ].filter(Boolean);

  return `Radar environment validation failed for ${environment}: ${details.join("; ")}`;
}

function normalizeEnvValue(value) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

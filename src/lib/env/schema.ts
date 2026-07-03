import { z } from "zod";

export const radarEnvironments = ["local", "preview", "staging", "production", "test"] as const;

export type RadarEnvironment = (typeof radarEnvironments)[number];

export const strictRadarEnvironments = ["preview", "staging", "production"] as const satisfies readonly RadarEnvironment[];

export const publicEnvKeys = [
  "NEXT_PUBLIC_RADAR_ENV",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_POSTHOG_KEY",
  "NEXT_PUBLIC_POSTHOG_HOST",
  "NEXT_PUBLIC_SENTRY_DSN",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
] as const;

export const serverEnvKeys = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "TRIGGER_SECRET_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "SLACK_WEBHOOK_URL",
  "RADAR_APP_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ID_STARTER",
  "SENTRY_AUTH_TOKEN",
  "LANGFUSE_PUBLIC_KEY",
  "LANGFUSE_SECRET_KEY",
  "LANGFUSE_BASE_URL",
] as const;

export const requiredPublicEnvKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_POSTHOG_KEY",
  "NEXT_PUBLIC_SENTRY_DSN",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
] as const satisfies readonly PublicEnvKey[];

export const requiredServerEnvKeys = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "TRIGGER_SECRET_KEY",
  "RESEND_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SENTRY_AUTH_TOKEN",
] as const satisfies readonly ServerEnvKey[];

export type PublicEnvKey = (typeof publicEnvKeys)[number];
export type ServerEnvKey = (typeof serverEnvKeys)[number];
export type RequiredEnvKey = (typeof requiredPublicEnvKeys)[number] | (typeof requiredServerEnvKeys)[number];

export type RawEnv = Partial<Record<PublicEnvKey | ServerEnvKey | "RADAR_ENV" | "VERCEL_ENV" | "NODE_ENV", string>>;

export type PublicEnv = Partial<Record<PublicEnvKey, string>> & {
  NEXT_PUBLIC_RADAR_ENV: RadarEnvironment;
};

export type ServerEnv = Partial<Record<ServerEnvKey, string>>;

export type ValidatedEnv = {
  environment: RadarEnvironment;
  isStrict: boolean;
  publicEnv: PublicEnv;
  serverEnv: ServerEnv;
};

export class EnvValidationError extends Error {
  constructor(
    message: string,
    readonly environment: RadarEnvironment,
    readonly missing: readonly RequiredEnvKey[] = [],
    readonly invalid: readonly string[] = [],
  ) {
    super(message);
    this.name = "EnvValidationError";
  }
}

const optionalText = z.preprocess((value) => normalizeEnvValue(value), z.string().min(1).optional());
const optionalUrl = z.preprocess((value) => normalizeEnvValue(value), z.string().url().optional());

const publicEnvSchema = z.object({
  NEXT_PUBLIC_RADAR_ENV: z.enum(radarEnvironments).optional(),
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalText,
  NEXT_PUBLIC_POSTHOG_KEY: optionalText,
  NEXT_PUBLIC_POSTHOG_HOST: optionalUrl,
  NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optionalText,
});

const serverEnvSchema = z.object({
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
  LANGFUSE_PUBLIC_KEY: optionalText,
  LANGFUSE_SECRET_KEY: optionalText,
  LANGFUSE_BASE_URL: optionalUrl,
});

export function resolveRadarEnvironment(env: RawEnv = process.env): RadarEnvironment {
  const explicitEnv = normalizeEnvValue(env.RADAR_ENV) ?? normalizeEnvValue(env.NEXT_PUBLIC_RADAR_ENV);

  if (isRadarEnvironment(explicitEnv)) {
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

export function shouldRequireServiceEnv(environment: RadarEnvironment) {
  return strictRadarEnvironments.includes(environment as (typeof strictRadarEnvironments)[number]);
}

export function validateEnv(rawEnv: RawEnv = process.env, options: { strict?: boolean } = {}): ValidatedEnv {
  const environment = resolveRadarEnvironment(rawEnv);
  const isStrict = options.strict ?? shouldRequireServiceEnv(environment);
  const publicResult = publicEnvSchema.safeParse(rawEnv);
  const serverResult = serverEnvSchema.safeParse(rawEnv);
  const invalid = [
    ...formatIssuePaths(publicResult.success ? [] : publicResult.error.issues),
    ...formatIssuePaths(serverResult.success ? [] : serverResult.error.issues),
  ];

  const publicEnv = publicResult.success ? publicResult.data : {};
  const serverEnv = serverResult.success ? serverResult.data : {};
  const missing = isStrict ? findMissingRequiredKeys({ ...publicEnv, ...serverEnv }) : [];

  if (invalid.length > 0 || missing.length > 0) {
    throw new EnvValidationError(formatEnvErrorMessage(environment, missing, invalid), environment, missing, invalid);
  }

  return {
    environment,
    isStrict,
    publicEnv: {
      ...publicEnv,
      NEXT_PUBLIC_RADAR_ENV: publicEnv.NEXT_PUBLIC_RADAR_ENV ?? environment,
    },
    serverEnv,
  };
}

export function formatEnvErrorMessage(
  environment: RadarEnvironment,
  missing: readonly string[],
  invalid: readonly string[],
) {
  const details = [
    missing.length > 0 ? `missing required variables: ${missing.join(", ")}` : undefined,
    invalid.length > 0 ? `invalid variables: ${invalid.join(", ")}` : undefined,
  ].filter(Boolean);

  return `Radar environment validation failed for ${environment}: ${details.join("; ")}`;
}

function findMissingRequiredKeys(env: Partial<Record<RequiredEnvKey, string>>) {
  return [...requiredPublicEnvKeys, ...requiredServerEnvKeys].filter((key) => !env[key]);
}

function normalizeEnvValue(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function isRadarEnvironment(value: unknown): value is RadarEnvironment {
  return typeof value === "string" && radarEnvironments.includes(value as RadarEnvironment);
}

function formatIssuePaths(issues: z.core.$ZodIssue[]) {
  return issues.map((issue) => issue.path.join(".")).filter(Boolean);
}

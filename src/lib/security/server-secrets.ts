import "server-only";

import { readEnv } from "@/lib/env";

export type ServerSecretName = "OPENAI_API_KEY";

const PUBLIC_ENV_PREFIX = "NEXT_PUBLIC_";

export function getRequiredServerSecret(
  name: ServerSecretName,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const value = readEnv(env[name]);

  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

export function hasConfiguredServerSecret(
  name: ServerSecretName,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return Boolean(readEnv(env[name]));
}

export function getOpenAIApiKey(env: NodeJS.ProcessEnv = process.env): string {
  assertNoPublicOpenAIEnv(env);
  return getRequiredServerSecret("OPENAI_API_KEY", env);
}

export function assertNoPublicOpenAIEnv(
  env: NodeJS.ProcessEnv = process.env,
): void {
  const publicOpenAIKeys = Object.keys(env).filter(
    (name) => name.startsWith(PUBLIC_ENV_PREFIX) && name.includes("OPENAI"),
  );

  if (publicOpenAIKeys.length > 0) {
    throw new Error(
      `OpenAI configuration must not use public env vars: ${publicOpenAIKeys.join(", ")}`,
    );
  }
}

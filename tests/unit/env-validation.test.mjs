import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

const validatorScript = "scripts/validate-env.mjs";

function runValidator(env) {
  return spawnSync(process.execPath, [validatorScript], {
    cwd: process.cwd(),
    env,
    encoding: "utf8",
  });
}

function strictEnv(overrides = {}) {
  return {
    RADAR_ENV: "production",
    NEXT_PUBLIC_SUPABASE_URL: "https://supabase.example.com",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    NEXT_PUBLIC_POSTHOG_KEY: "phc_test",
    NEXT_PUBLIC_SENTRY_DSN: "https://public@example.ingest.sentry.io/1",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_radar",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    OPENAI_API_KEY: "sk-test-radar",
    TRIGGER_SECRET_KEY: "tr_dev_radar",
    RESEND_API_KEY: "re_test_radar",
    STRIPE_SECRET_KEY: "sk_test_radar",
    STRIPE_WEBHOOK_SECRET: "whsec_radar",
    SENTRY_AUTH_TOKEN: "sentry-token",
    ...overrides,
  };
}

test("RAD-004 allows empty local placeholders", () => {
  const result = runValidator({ RADAR_ENV: "local" });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /validation passed for local/);
});

test("RAD-004 fails strict environments with variable names only", () => {
  const secretValue = "do-not-print-this-secret";
  const result = runValidator({
    RADAR_ENV: "production",
    OPENAI_API_KEY: secretValue,
  });
  const output = `${result.stdout}${result.stderr}`;

  assert.notEqual(result.status, 0);
  assert.match(output, /Radar environment validation failed for production/);
  assert.match(output, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(output, /STRIPE_WEBHOOK_SECRET/);
  assert.doesNotMatch(output, new RegExp(secretValue));
});

test("RAD-004 accepts complete strict production configuration", () => {
  const result = runValidator(strictEnv());

  assert.equal(result.status, 0);
  assert.match(result.stdout, /validation passed for production/);
});

test("RAD-004 reports invalid URL variables without leaking values", () => {
  const invalidValue = "not-a-valid-url";
  const result = runValidator(strictEnv({ NEXT_PUBLIC_SUPABASE_URL: invalidValue }));
  const output = `${result.stdout}${result.stderr}`;

  assert.notEqual(result.status, 0);
  assert.match(output, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.doesNotMatch(output, new RegExp(invalidValue));
});

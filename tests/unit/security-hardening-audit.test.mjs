import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-096 configures global security headers and CSP", async () => {
  const nextConfig = await readWorkspaceFile("next.config.ts");

  assert.match(nextConfig, /securityHeaders/);
  assert.match(nextConfig, /Content-Security-Policy-Report-Only/);
  assert.match(nextConfig, /frame-ancestors 'none'/);
  assert.match(nextConfig, /object-src 'none'/);
  assert.match(nextConfig, /X-Frame-Options/);
  assert.match(nextConfig, /DENY/);
  assert.match(nextConfig, /X-Content-Type-Options/);
  assert.match(nextConfig, /nosniff/);
  assert.match(nextConfig, /Referrer-Policy/);
  assert.match(nextConfig, /Permissions-Policy/);
  assert.match(nextConfig, /async headers\(\)/);
});

test("RAD-096 hardens Supabase auth defaults", async () => {
  const config = await readWorkspaceFile("supabase/config.toml");

  assert.match(config, /minimum_password_length = 12/);
  assert.match(config, /password_requirements = "lower_upper_letters_digits"/);
  assert.match(config, /secure_password_change = true/);
  assert.match(config, /max_frequency = "60s"/);
  assert.match(config, /otp_length = 8/);
  assert.match(config, /otp_expiry = 1800/);
  assert.match(config, /enable_anonymous_sign_ins = false/);
});

test("RAD-096 scans uploads and rejects unsafe signed webhook payloads", async () => {
  const extraction = await readWorkspaceFile("src/lib/sources/file-extraction.ts");
  const stripeWebhook = await readWorkspaceFile("src/app/api/billing/stripe-webhook/route.ts");

  assert.match(extraction, /scanUploadedDocumentBuffer/);
  assert.match(extraction, /unsafe_file/);
  assert.match(extraction, /hasBlockedBinarySignature/);
  assert.match(extraction, /looksLikeHtmlOrScript/);
  assert.match(extraction, /Uploaded document failed the safety scan/);
  assert.match(stripeWebhook, /verifyStripeWebhookSignature/);
  assert.match(stripeWebhook, /parseStripeEventPayload/);
  assert.match(stripeWebhook, /Invalid Stripe payload/);
  assert.match(stripeWebhook, /return null/);
});

test("RAD-096 documents security audit scope and avoids runtime sensitive logging", async () => {
  const security = await readWorkspaceFile("docs/SECURITY.md");
  const runtimeFiles = [
    await readWorkspaceFile("src/lib/server/guardrails.ts"),
    await readWorkspaceFile("src/lib/observability/sentry.ts"),
    await readWorkspaceFile("src/lib/observability/langfuse.ts"),
    await readWorkspaceFile("src/lib/evaluation/integration-runner.ts"),
    await readWorkspaceFile("src/lib/evaluation/knowledge-runner.ts"),
    await readWorkspaceFile("src/app/api/billing/stripe-webhook/route.ts"),
  ].join("\n");

  assert.match(security, /Security Hardening Audit/);
  assert.match(security, /CSP report-only/);
  assert.match(security, /Stripe webhooks require a verified `stripe-signature`/);
  assert.match(security, /Uploaded TXT, Markdown, and PDF documents pass a content safety scan/);
  assert.doesNotMatch(runtimeFiles, /console\.(log|error|warn)/);
  assert.doesNotMatch(runtimeFiles, /dangerouslySetInnerHTML|eval\(|new Function\(/);
});

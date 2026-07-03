import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { z } from "zod";

export const runnerCredentialSecurityVersion = "rad-069";

export const runnerCredentialTypes = ["secret", "bearer_token", "api_key", "basic_password"] as const;
export const runnerCredentialTestStatuses = ["untested", "verified", "failed"] as const;

const encryptedEnvelopeSchema = z.object({
  version: z.literal(runnerCredentialSecurityVersion),
  algorithm: z.literal("aes-256-gcm"),
  keyId: z.string().trim().min(1).max(120),
  iv: z.string().trim().min(1),
  tag: z.string().trim().min(1),
  ciphertext: z.string().trim().min(1),
});

export const runnerCredentialEncryptionKeySchema = z.object({
  keyId: z.string().trim().min(1).max(120),
  secret: z.string().min(16).max(4096),
});

export const runnerCredentialPlaintextSchema = z.string().min(1).max(10_000);

export type RunnerCredentialType = (typeof runnerCredentialTypes)[number];
export type RunnerCredentialTestStatus = (typeof runnerCredentialTestStatuses)[number];
export type RunnerCredentialEncryptionKey = z.infer<typeof runnerCredentialEncryptionKeySchema>;
export type EncryptedRunnerCredentialEnvelope = z.infer<typeof encryptedEnvelopeSchema>;

export function encryptRunnerCredentialValue(
  plaintext: string,
  key: RunnerCredentialEncryptionKey,
) {
  const parsedPlaintext = runnerCredentialPlaintextSchema.parse(plaintext);
  const parsedKey = runnerCredentialEncryptionKeySchema.parse(key);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveCredentialKey(parsedKey.secret), iv);
  const ciphertext = Buffer.concat([cipher.update(parsedPlaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return JSON.stringify({
    version: runnerCredentialSecurityVersion,
    algorithm: "aes-256-gcm",
    keyId: parsedKey.keyId,
    iv: iv.toString("base64url"),
    tag: tag.toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
  } satisfies EncryptedRunnerCredentialEnvelope);
}

export function decryptRunnerCredentialValue(
  encryptedValue: string,
  key: RunnerCredentialEncryptionKey,
) {
  const parsedKey = runnerCredentialEncryptionKeySchema.parse(key);
  const envelope = encryptedEnvelopeSchema.parse(JSON.parse(encryptedValue) as unknown);

  if (!constantTimeEqual(envelope.keyId, parsedKey.keyId)) {
    throw new RunnerCredentialSecurityError("Runner credential encryption key id does not match.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    deriveCredentialKey(parsedKey.secret),
    Buffer.from(envelope.iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function runnerCredentialRedactionLabel(name: string, redactionLabel?: string | null) {
  return redactionLabel?.trim() || `[redacted:${name}]`;
}

export function redactRunnerCredentialText(
  value: string,
  credentials: readonly { name: string; value?: string; redactionLabel?: string | null }[] = [],
) {
  const redactedCredentialValues = credentials.reduce((redacted, credential) => {
    if (!credential.value) {
      return redacted;
    }

    return redacted
      .split(credential.value)
      .join(runnerCredentialRedactionLabel(credential.name, credential.redactionLabel));
  }, value);

  return redactedCredentialValues
    .replace(/authorization:\s*bearer\s+[a-z0-9._-]+/gi, "authorization: bearer [redacted-token]")
    .replace(/\b(?:bearer\s+)?[a-z0-9_-]{24,}\b/gi, "[redacted-token]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]");
}

export function runnerCredentialPublicMetadata(input: {
  id: string;
  name: string;
  credentialType: RunnerCredentialType;
  redactionLabel?: string | null;
  lastTestStatus: RunnerCredentialTestStatus;
  lastTestedAt?: string | null;
}) {
  return {
    id: input.id,
    name: input.name,
    credentialType: input.credentialType,
    redacted: true,
    redactionLabel: runnerCredentialRedactionLabel(input.name, input.redactionLabel),
    lastTestStatus: input.lastTestStatus,
    lastTestedAt: input.lastTestedAt ?? undefined,
  };
}

function deriveCredentialKey(secret: string) {
  return createHash("sha256").update(secret).digest();
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export class RunnerCredentialSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RunnerCredentialSecurityError";
  }
}

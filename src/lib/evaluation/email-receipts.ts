import "server-only";

import { createHash } from "node:crypto";

import { z } from "zod";

import type { RunnerEvidenceArtifact } from "@/lib/evaluation/runner-contract";
import type { JsonRecord } from "@/lib/repositories";

export const emailReceiptUtilityVersion = "rad-065";

export const emailReceiptSourceKinds = ["test_mailbox", "webhook"] as const;

const boundedSubjectSchema = z.string().trim().min(1).max(500);
const boundedBodySchema = z.string().trim().min(1).max(50_000);
const boundedHeaderSchema = z.string().trim().max(1_000);
const boundedMetadataSchema = z.record(z.string(), z.unknown()).default({});

export const emailReceiptMessageSchema = z.object({
  id: z.string().trim().min(1).max(200).optional(),
  sourceKind: z.enum(emailReceiptSourceKinds).default("test_mailbox"),
  receivedAt: z.iso.datetime(),
  to: z.array(z.string().trim().email().max(320)).min(1).max(20),
  from: z.string().trim().email().max(320).optional(),
  subject: boundedSubjectSchema,
  textBody: boundedBodySchema.optional(),
  htmlBody: boundedBodySchema.optional(),
  headers: z.record(z.string(), boundedHeaderSchema).default({}),
  metadata: boundedMetadataSchema,
});

export const emailReceiptExpectationSchema = z.object({
  to: z.string().trim().email().max(320).optional(),
  subjectContains: z.string().trim().min(1).max(300).optional(),
  bodyContains: z.string().trim().min(1).max(1_000).optional(),
  receivedAfter: z.iso.datetime().optional(),
  receivedBefore: z.iso.datetime().optional(),
  sourceKind: z.enum(emailReceiptSourceKinds).optional(),
}).refine(
  (expectation) => Boolean(expectation.to || expectation.subjectContains || expectation.bodyContains),
  "Email receipt expectations must include a recipient, subject matcher, or body matcher.",
);

export const emailReceiptVerificationInputSchema = z.object({
  expectation: emailReceiptExpectationSchema,
  messages: z.array(emailReceiptMessageSchema).max(200),
  label: z.string().trim().min(1).max(120).default("email-receipt"),
  now: z.iso.datetime().optional(),
});

export type EmailReceiptSourceKind = (typeof emailReceiptSourceKinds)[number];
export type EmailReceiptMessage = z.infer<typeof emailReceiptMessageSchema>;
export type EmailReceiptExpectation = z.infer<typeof emailReceiptExpectationSchema>;
export type EmailReceiptVerificationInput = z.input<typeof emailReceiptVerificationInputSchema>;
type ParsedEmailReceiptVerificationInput = z.infer<typeof emailReceiptVerificationInputSchema>;

export type EmailReceiptVerificationResult = {
  status: "passed" | "failed";
  matched: boolean;
  summary: string;
  actualOutput: JsonRecord;
  artifacts: RunnerEvidenceArtifact[];
};

export function verifyEmailReceipt(input: EmailReceiptVerificationInput): EmailReceiptVerificationResult {
  const parsedInput = emailReceiptVerificationInputSchema.parse(input);
  const matches = parsedInput.messages
    .filter((message) => emailReceiptMatchesExpectation(message, parsedInput.expectation))
    .sort((left, right) => Date.parse(right.receivedAt) - Date.parse(left.receivedAt));
  const matchedReceipt = matches[0];
  const actualOutput = emailReceiptActualOutput(parsedInput, matchedReceipt);

  if (!matchedReceipt) {
    return {
      status: "failed",
      matched: false,
      summary: `No matching email receipt found after checking ${parsedInput.messages.length} message(s).`,
      actualOutput,
      artifacts: [],
    };
  }

  return {
    status: "passed",
    matched: true,
    summary: `Matched email receipt received at ${matchedReceipt.receivedAt}.`,
    actualOutput,
    artifacts: [buildEmailReceiptArtifact(matchedReceipt, parsedInput.expectation, parsedInput.label)],
  };
}

export function emailReceiptMatchesExpectation(
  message: EmailReceiptMessage,
  expectation: EmailReceiptExpectation,
) {
  const parsedMessage = emailReceiptMessageSchema.parse(message);
  const parsedExpectation = emailReceiptExpectationSchema.parse(expectation);
  const receivedAtMs = Date.parse(parsedMessage.receivedAt);

  if (parsedExpectation.sourceKind && parsedMessage.sourceKind !== parsedExpectation.sourceKind) {
    return false;
  }

  if (parsedExpectation.receivedAfter && receivedAtMs < Date.parse(parsedExpectation.receivedAfter)) {
    return false;
  }

  if (parsedExpectation.receivedBefore && receivedAtMs > Date.parse(parsedExpectation.receivedBefore)) {
    return false;
  }

  const expectedRecipient = parsedExpectation.to;

  if (expectedRecipient && !parsedMessage.to.some((recipient) => equalsFold(recipient, expectedRecipient))) {
    return false;
  }

  if (
    parsedExpectation.subjectContains &&
    !containsFold(parsedMessage.subject, parsedExpectation.subjectContains)
  ) {
    return false;
  }

  if (
    parsedExpectation.bodyContains &&
    !containsFold(emailReceiptBody(parsedMessage), parsedExpectation.bodyContains)
  ) {
    return false;
  }

  return true;
}

export function normalizeEmailReceiptWebhookPayload(
  payload: unknown,
  fallbackSourceKind: EmailReceiptSourceKind = "webhook",
): EmailReceiptMessage {
  const record = asRecord(payload);
  const headers = asStringRecord(record.headers);

  return emailReceiptMessageSchema.parse({
    id: firstString(record, ["id", "messageId", "message_id", "event_id"]),
    sourceKind: firstSourceKind(record, ["sourceKind", "source_kind"]) ?? fallbackSourceKind,
    receivedAt: firstString(record, ["receivedAt", "received_at", "timestamp", "created_at"]) ?? new Date().toISOString(),
    to: recipientList(record),
    from: firstString(record, ["from", "sender", "from_email"]),
    subject: firstString(record, ["subject"]) ?? "(no subject)",
    textBody: firstString(record, ["textBody", "text_body", "text", "body", "bodyText"]),
    htmlBody: firstString(record, ["htmlBody", "html_body", "html", "bodyHtml"]),
    headers,
    metadata: {
      provider: firstString(record, ["provider", "source", "event_type"]) ?? fallbackSourceKind,
      redacted: true,
    },
  });
}

export function buildEmailReceiptArtifact(
  message: EmailReceiptMessage,
  expectation: EmailReceiptExpectation,
  label = "email-receipt",
): RunnerEvidenceArtifact {
  const parsedMessage = emailReceiptMessageSchema.parse(message);
  const parsedExpectation = emailReceiptExpectationSchema.parse(expectation);

  return {
    kind: "email_receipt",
    label,
    redacted: true,
    metadata: {
      runnerVersion: emailReceiptUtilityVersion,
      sourceKind: parsedMessage.sourceKind,
      receiptId: parsedMessage.id ? stableHash(parsedMessage.id) : stableHash(JSON.stringify(emailReceiptSafeSummary(parsedMessage))),
      receivedAt: parsedMessage.receivedAt,
      toHashes: parsedMessage.to.map(stableHash),
      fromHash: parsedMessage.from ? stableHash(parsedMessage.from) : undefined,
      subjectHash: stableHash(parsedMessage.subject),
      subjectPreview: safeReceiptPreview(parsedMessage.subject, 140),
      bodyHash: stableHash(emailReceiptBody(parsedMessage)),
      matched: matcherSummary(parsedExpectation),
    },
  };
}

export function emailReceiptSafeSummary(message: EmailReceiptMessage): JsonRecord {
  const parsedMessage = emailReceiptMessageSchema.parse(message);

  return {
    sourceKind: parsedMessage.sourceKind,
    receivedAt: parsedMessage.receivedAt,
    toHashes: parsedMessage.to.map(stableHash),
    fromHash: parsedMessage.from ? stableHash(parsedMessage.from) : undefined,
    subjectPreview: safeReceiptPreview(parsedMessage.subject, 140),
    bodyHash: stableHash(emailReceiptBody(parsedMessage)),
    headerNames: Object.keys(parsedMessage.headers).sort().slice(0, 20),
  };
}

export function redactEmailReceiptText(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/https?:\/\/\S+/gi, "[redacted-url]")
    .replace(/\b(?:bearer\s+)?[a-z0-9_-]{24,}\b/gi, "[redacted-token]");
}

function emailReceiptActualOutput(
  input: ParsedEmailReceiptVerificationInput,
  matchedReceipt: EmailReceiptMessage | undefined,
): JsonRecord {
  return {
    checkedMessageCount: input.messages.length,
    matched: Boolean(matchedReceipt),
    expectation: {
      toHash: input.expectation.to ? stableHash(input.expectation.to) : undefined,
      subjectContains: input.expectation.subjectContains
        ? safeReceiptPreview(input.expectation.subjectContains, 120)
        : undefined,
      bodyContains: input.expectation.bodyContains
        ? safeReceiptPreview(input.expectation.bodyContains, 120)
        : undefined,
      receivedAfter: input.expectation.receivedAfter,
      receivedBefore: input.expectation.receivedBefore,
      sourceKind: input.expectation.sourceKind,
    },
    matchedReceipt: matchedReceipt ? emailReceiptSafeSummary(matchedReceipt) : null,
    generatedAt: input.now ?? new Date().toISOString(),
  };
}

function matcherSummary(expectation: EmailReceiptExpectation): JsonRecord {
  return {
    to: Boolean(expectation.to),
    subjectContains: Boolean(expectation.subjectContains),
    bodyContains: Boolean(expectation.bodyContains),
    receivedAfter: Boolean(expectation.receivedAfter),
    receivedBefore: Boolean(expectation.receivedBefore),
  };
}

function emailReceiptBody(message: EmailReceiptMessage) {
  return [message.textBody, stripHtml(message.htmlBody)].filter(Boolean).join("\n");
}

function safeReceiptPreview(value: string, limit: number) {
  const redacted = redactEmailReceiptText(value).replace(/\s+/g, " ").trim();
  return redacted.length > limit ? `${redacted.slice(0, limit - 3)}...` : redacted;
}

function stableHash(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function containsFold(value: string, expectedSubstring: string) {
  return value.toLocaleLowerCase().includes(expectedSubstring.toLocaleLowerCase());
}

function equalsFold(left: string, right: string) {
  return left.toLocaleLowerCase() === right.toLocaleLowerCase();
}

function stripHtml(value: string | undefined) {
  return value?.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ");
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function asStringRecord(value: unknown) {
  const record = asRecord(value);
  const entries = Object.entries(record)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .slice(0, 50);

  return Object.fromEntries(entries);
}

function firstString(record: Record<string, unknown>, keys: readonly string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function firstSourceKind(record: Record<string, unknown>, keys: readonly string[]) {
  const value = firstString(record, keys);

  if (value === "test_mailbox" || value === "webhook") {
    return value;
  }

  return undefined;
}

function recipientList(record: Record<string, unknown>) {
  const value = record.to ?? record.recipient ?? record.recipients ?? record.to_email;
  const recipients = Array.isArray(value) ? value : [value];

  return recipients
    .flatMap((recipient) => {
      if (typeof recipient !== "string") {
        return [];
      }

      return recipient.split(",");
    })
    .map((recipient) => recipient.trim())
    .filter(Boolean);
}

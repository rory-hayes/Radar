import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function fileExists(relativePath) {
  await access(relativePath);
  return true;
}

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-065 adds a server-only email receipt verification utility", async () => {
  await fileExists("src/lib/evaluation/email-receipts.ts");

  const utility = await readWorkspaceFile("src/lib/evaluation/email-receipts.ts");

  assert.match(utility, /server-only/);
  assert.match(utility, /emailReceiptUtilityVersion = "rad-065"/);
  assert.match(utility, /emailReceiptMessageSchema/);
  assert.match(utility, /emailReceiptExpectationSchema/);
  assert.match(utility, /emailReceiptVerificationInputSchema/);
  assert.match(utility, /verifyEmailReceipt/);
});

test("RAD-065 supports test mailbox and webhook receipt payloads", async () => {
  const utility = await readWorkspaceFile("src/lib/evaluation/email-receipts.ts");
  const schema = await readWorkspaceFile("src/lib/evaluation/journey-schema.ts");

  assert.match(utility, /emailReceiptSourceKinds = \["test_mailbox", "webhook"\]/);
  assert.match(utility, /normalizeEmailReceiptWebhookPayload/);
  assert.match(utility, /recipientList/);
  assert.match(utility, /sourceKind: z\.enum\(emailReceiptSourceKinds\)\.optional\(\)/);
  assert.match(schema, /type: z\.literal\("verify_email"\)/);
  assert.match(schema, /type: z\.literal\("email_received"\)/);
});

test("RAD-065 matches recipient subject body and received-window expectations", async () => {
  const utility = await readWorkspaceFile("src/lib/evaluation/email-receipts.ts");

  for (const matcher of [
    "subjectContains",
    "bodyContains",
    "receivedAfter",
    "receivedBefore",
    "emailReceiptMatchesExpectation",
    "containsFold",
    "equalsFold",
  ]) {
    assert.match(utility, new RegExp(matcher));
  }

  assert.match(utility, /status: "passed"/);
  assert.match(utility, /status: "failed"/);
  assert.match(utility, /checkedMessageCount/);
  assert.match(utility, /No matching email receipt found/);
});

test("RAD-065 emits redacted email receipt artifacts without raw secrets", async () => {
  const utility = await readWorkspaceFile("src/lib/evaluation/email-receipts.ts");
  const runnerContract = await readWorkspaceFile("src/lib/evaluation/runner-contract.ts");
  const validation = await readWorkspaceFile("src/lib/validation/schemas.ts");
  const storage = await readWorkspaceFile("src/lib/storage/evidence-artifacts.ts");
  const runnerSpec = await readWorkspaceFile("docs/RUNNERS_SPEC.md");

  assert.match(runnerContract, /"email_receipt"/);
  assert.match(validation, /"email-receipt"/);
  assert.match(storage, /"email-receipt": "Email receipt"/);
  assert.match(utility, /kind: "email_receipt"/);
  assert.match(utility, /redacted: true/);
  assert.match(utility, /stableHash/);
  assert.match(utility, /toHashes/);
  assert.match(utility, /subjectHash/);
  assert.match(utility, /bodyHash/);
  assert.match(utility, /redactEmailReceiptText/);
  assert.match(utility, /\[redacted-email\]/);
  assert.match(utility, /\[redacted-url\]/);
  assert.match(utility, /\[redacted-token\]/);
  assert.match(runnerSpec, /RAD-065 adds a server-only email receipt verification utility/);
  assert.match(runnerSpec, /redacted `email_receipt` evidence artifacts/);

  assert.doesNotMatch(utility, /console\.log|console\.error/);
  assert.doesNotMatch(utility, /gmail|mailgun|sendgrid|postmark/i);
});

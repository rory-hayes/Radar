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

test("RAD-064 adds a Trial & Onboarding Journey pack", async () => {
  await fileExists("src/lib/evaluation/journey-packs.ts");

  const packs = await readWorkspaceFile("src/lib/evaluation/journey-packs.ts");

  assert.match(packs, /journeyPackSlugs = \["trial-onboarding"\]/);
  assert.match(packs, /trialOnboardingJourneyPack/);
  assert.match(packs, /CreateTrialOnboardingJourneyDefinition|createTrialOnboardingJourneyDefinition/);
  assert.match(packs, /runnerType: "journey"/);
  assert.match(packs, /requiredConfiguration/);
});

test("RAD-064 pack produces configurable signup URL and credential-reference steps", async () => {
  const packs = await readWorkspaceFile("src/lib/evaluation/journey-packs.ts");

  assert.match(packs, /signupUrl/);
  assert.match(packs, /submitButtonName/);
  assert.match(packs, /emailCredentialName/);
  assert.match(packs, /passwordCredentialName/);
  assert.match(packs, /id: "visit-signup"/);
  assert.match(packs, /id: "enter-email"/);
  assert.match(packs, /id: "enter-password"/);
  assert.match(packs, /kind: "credential_ref"/);
  assert.doesNotMatch(packs, /trial@example\.com|password123|secret|apiKey|accessToken/i);
});

test("RAD-064 pack captures onboarding evidence and success states", async () => {
  const packs = await readWorkspaceFile("src/lib/evaluation/journey-packs.ts");
  const runnerSpec = await readWorkspaceFile("docs/RUNNERS_SPEC.md");

  assert.match(packs, /id: "submit-signup"/);
  assert.match(packs, /id: "wait-for-onboarding"/);
  assert.match(packs, /id: "capture-onboarding-state"/);
  assert.match(packs, /artifactLabel: "trial-onboarding-success"/);
  assert.match(packs, /expectedUrlContains/);
  assert.match(packs, /expectedVisibleText/);
  assert.match(packs, /trialOnboardingSuccessConditions/);
  assert.match(runnerSpec, /RAD-064 adds the first Journey pack for Trial & Onboarding/);
  assert.match(runnerSpec, /configurable signup URL, credential names, submit button label, and expected success states/);
});

test("RAD-064 keeps the pack declarative and out of workflow-builder scope", async () => {
  const packs = await readWorkspaceFile("src/lib/evaluation/journey-packs.ts");
  const templates = await readWorkspaceFile("src/lib/assertions/templates.ts");

  assert.match(templates, /slug: "trial-onboarding"/);
  assert.match(templates, /runnerType: "journey"/);
  assert.match(packs, /parseJourneyDefinition/);
  assert.doesNotMatch(packs, /workflow canvas|visual builder|marketplace|prompt playground|trace explorer/i);
  assert.doesNotMatch(packs, /console\.log|console\.error/);
});

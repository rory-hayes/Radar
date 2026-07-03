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

test("RAD-062 adds a server-only Playwright Journey Runner foundation", async () => {
  await fileExists("src/lib/evaluation/journey-runner.ts");

  const runner = await readWorkspaceFile("src/lib/evaluation/journey-runner.ts");
  const pkg = await readWorkspaceFile("package.json");

  assert.match(runner, /server-only/);
  assert.match(runner, /journeyRunnerFoundationVersion = "rad-062"/);
  assert.match(runner, /from "playwright"/);
  assert.match(runner, /chromium\.launch\(\{ headless: true \}\)/);
  assert.match(runner, /browser\.newContext/);
  assert.match(runner, /storageState: undefined/);
  assert.match(pkg, /"playwright":/);
});

test("RAD-062 configures isolated contexts timeouts screenshots and traces", async () => {
  const runner = await readWorkspaceFile("src/lib/evaluation/journey-runner.ts");

  assert.match(runner, /defaultJourneyRunnerTimeouts/);
  assert.match(runner, /context\.setDefaultTimeout\(timeouts\.actionTimeoutMs\)/);
  assert.match(runner, /context\.setDefaultNavigationTimeout\(timeouts\.navigationTimeoutMs\)/);
  assert.match(runner, /withJourneyTimeout/);
  assert.match(runner, /context\.tracing\.start\(\{ screenshots: true, snapshots: true, sources: false \}\)/);
  assert.match(runner, /page\.screenshot\(\{ fullPage: true, type: "png" \}\)/);
  assert.match(runner, /context\.tracing\.stop\(\{ path: tracePath \}\)/);
  assert.match(runner, /browser\.close\(\)/);
});

test("RAD-062 persists Journey artifacts through private evidence storage", async () => {
  const runner = await readWorkspaceFile("src/lib/evaluation/journey-runner.ts");
  const storage = await readWorkspaceFile("src/lib/storage/evidence-artifacts.ts");

  assert.match(runner, /uploadEvidenceArtifact/);
  assert.match(runner, /artifactKind: "screenshot"/);
  assert.match(runner, /artifactKind: "run-artifact"/);
  assert.match(runner, /kind: "screenshot"/);
  assert.match(runner, /kind: "trace"/);
  assert.match(runner, /ownerId: input\.runnerContext\.run\.id/);
  assert.match(storage, /evidenceArtifactsBucket = "radar-evidence-artifacts"/);
});

test("RAD-062 handles credentials by redaction only", async () => {
  const runner = await readWorkspaceFile("src/lib/evaluation/journey-runner.ts");
  const runnerSpec = await readWorkspaceFile("docs/RUNNERS_SPEC.md");

  assert.match(runner, /JourneyCredentialInput/);
  assert.match(runner, /redactedJourneyCredentialMetadata/);
  assert.match(runner, /redactJourneyText/);
  assert.match(runner, /\[redacted:\$\{credential\.name\}\]/);
  assert.match(runnerSpec, /RAD-062 adds the Playwright Journey Runner foundation/);
  assert.match(runnerSpec, /Credential values are accepted only at execution time/);

  for (const source of [runner, runnerSpec]) {
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace|model comparison/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }

  assert.doesNotMatch(runner, /Bearer [A-Za-z0-9]|apiKey|secretKey|accessToken|refreshToken|service_role|sb_secret/i);
});

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

test("RAD-069 adds encrypted workspace-scoped runner credentials schema", async () => {
  await fileExists("supabase/migrations/20260703114000_create_runner_credentials.sql");

  const migration = await readWorkspaceFile("supabase/migrations/20260703114000_create_runner_credentials.sql");

  assert.match(migration, /create table public\.runner_credentials/);
  assert.match(migration, /workspace_id uuid not null references public\.workspaces/);
  assert.match(migration, /encrypted_value text not null/);
  assert.match(migration, /encryption_key_id text not null/);
  assert.match(migration, /alter table public\.runner_credentials enable row level security/);
  assert.match(migration, /alter table public\.runner_credentials force row level security/);
  assert.match(migration, /workspace editors can read runner credential metadata/);
  assert.match(migration, /workspace admins can delete runner credentials/);
});

test("RAD-069 adds server-only AES-GCM credential encryption helpers", async () => {
  await fileExists("src/lib/credentials/runner-credentials.ts");

  const helper = await readWorkspaceFile("src/lib/credentials/runner-credentials.ts");

  assert.match(helper, /server-only/);
  assert.match(helper, /runnerCredentialSecurityVersion = "rad-069"/);
  assert.match(helper, /createCipheriv\("aes-256-gcm"/);
  assert.match(helper, /createDecipheriv\(\s*"aes-256-gcm"/);
  assert.match(helper, /encryptRunnerCredentialValue/);
  assert.match(helper, /decryptRunnerCredentialValue/);
  assert.match(helper, /timingSafeEqual/);
  assert.match(helper, /RunnerCredentialSecurityError/);
});

test("RAD-069 repository omits encrypted values from summary reads", async () => {
  await fileExists("src/lib/repositories/runner-credentials.ts");

  const repository = await readWorkspaceFile("src/lib/repositories/runner-credentials.ts");
  const index = await readWorkspaceFile("src/lib/repositories/index.ts");

  assert.match(repository, /server-only/);
  assert.match(repository, /runnerCredentialSummarySelect/);
  assert.match(repository, /runnerCredentialSecretSelect/);
  assert.match(repository, /createRunnerCredential/);
  assert.match(repository, /listRunnerCredentials/);
  assert.match(repository, /getRunnerCredentialPlaintext/);
  assert.match(repository, /runnerCredentialSummaryForClient/);
  assert.match(repository, /encrypted_value/);
  assert.match(index, /repositories\/runner-credentials/);

  assert.doesNotMatch(repository.match(/const runnerCredentialSummarySelect[\s\S]*?;/)?.[0] ?? "", /encrypted_value/);
});

test("RAD-069 supports credential test actions without exposing plaintext", async () => {
  const repository = await readWorkspaceFile("src/lib/repositories/runner-credentials.ts");

  assert.match(repository, /testRunnerCredential/);
  assert.match(repository, /RunnerCredentialTester/);
  assert.match(repository, /decryptRunnerCredentialValue/);
  assert.match(repository, /updateRunnerCredentialTestStatus/);
  assert.match(repository, /last_tested_at/);
  assert.match(repository, /last_test_status/);
  assert.match(repository, /last_test_error/);
  assert.match(repository, /status: Exclude<RunnerCredentialTestStatus, "untested">/);
});

test("RAD-069 redacts runner credentials from artifacts and docs", async () => {
  const helper = await readWorkspaceFile("src/lib/credentials/runner-credentials.ts");
  const integrationRunner = await readWorkspaceFile("src/lib/evaluation/integration-runner.ts");
  const runnerSpec = await readWorkspaceFile("docs/RUNNERS_SPEC.md");
  const security = await readWorkspaceFile("docs/SECURITY.md");
  const dataModel = await readWorkspaceFile("docs/DATA_MODEL.md");

  assert.match(helper, /redactRunnerCredentialText/);
  assert.match(helper, /\[redacted-token\]/);
  assert.match(helper, /\[redacted-email\]/);
  assert.match(helper, /runnerCredentialPublicMetadata/);
  assert.match(integrationRunner, /redactRunnerCredentialText/);
  assert.match(runnerSpec, /RAD-069 hardens runner credential handling/);
  assert.match(security, /Plaintext may be decrypted only inside explicit server-side execution or credential-test actions/);
  assert.match(dataModel, /Product reads should use summary selectors that omit `encrypted_value`/);

  for (const source of [helper, integrationRunner]) {
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});

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

test("RAD-017 adds server-only action and API guardrails", async () => {
  await fileExists("src/lib/server/guardrails.ts");

  const guardrails = await readWorkspaceFile("src/lib/server/guardrails.ts");

  assert.match(guardrails, /server-only/);
  assert.match(guardrails, /ServerGuardrailError/);
  assert.match(guardrails, /ServerActionResponse/);
  assert.match(guardrails, /runAuthenticatedServerAction/);
  assert.match(guardrails, /runWorkspaceServerAction/);
  assert.match(guardrails, /runAuthenticatedApiHandler/);
  assert.match(guardrails, /runWorkspaceApiHandler/);
  assert.match(guardrails, /parseServerInput/);
  assert.match(guardrails, /NextResponse\.json/);
});

test("RAD-017 guardrails enforce auth, workspace membership, and permission checks", async () => {
  const guardrails = await readWorkspaceFile("src/lib/server/guardrails.ts");

  assert.match(guardrails, /getAuthenticatedUser\(\)/);
  assert.match(guardrails, /getActiveWorkspaceForCurrentUser\(\)/);
  assert.match(guardrails, /membershipCan\(membership, permission\)/);
  assert.match(guardrails, /describePermission\(permission\)/);
  assert.match(guardrails, /unauthenticated/);
  assert.match(guardrails, /workspace_required/);
  assert.match(guardrails, /unauthorized/);
  assert.match(guardrails, /validation/);
});

test("RAD-017 moves existing workspace mutations onto the shared guardrails", async () => {
  const createWorkspaceAction = await readWorkspaceFile("src/app/(workspace)/workspace/new/actions.ts");
  const settingsAction = await readWorkspaceFile("src/app/(app)/settings/actions.ts");

  assert.match(createWorkspaceAction, /runAuthenticatedServerAction/);
  assert.match(createWorkspaceAction, /createWorkspaceSchema/);
  assert.match(createWorkspaceAction, /serverActionErrorState/);
  assert.doesNotMatch(createWorkspaceAction, /instanceof z\.ZodError/);

  assert.match(settingsAction, /runWorkspaceServerAction/);
  assert.match(settingsAction, /permission: "workspace:manage"/);
  assert.match(settingsAction, /updateWorkspaceSettingsSchema/);
  assert.match(settingsAction, /serverActionErrorState/);
  assert.doesNotMatch(settingsAction, /instanceof z\.ZodError/);
});

test("RAD-017 documents server action and API response conventions", async () => {
  const security = await readWorkspaceFile("docs/SECURITY.md");
  const architecture = await readWorkspaceFile("docs/ARCHITECTURE.md");

  assert.match(security, /Server Action and API Guardrails/);
  assert.match(security, /runWorkspaceServerAction/);
  assert.match(security, /runWorkspaceApiHandler/);
  assert.match(security, /must validate input before writes/);
  assert.match(architecture, /Server guardrails/);
  assert.match(architecture, /standardized action and JSON API response envelopes/);
});

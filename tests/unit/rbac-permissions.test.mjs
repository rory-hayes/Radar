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

test("RAD-013 defines the Admin Editor Viewer permission matrix", async () => {
  const permissions = await readWorkspaceFile("src/lib/workspaces/permissions.ts");

  assert.match(permissions, /export const workspacePermissions = \[/);
  assert.match(permissions, /"assertion:create"/);
  assert.match(permissions, /"assertion:edit"/);
  assert.match(permissions, /"assertion:delete"/);
  assert.match(permissions, /"source:create"/);
  assert.match(permissions, /"source:edit"/);
  assert.match(permissions, /"source:delete"/);
  assert.match(permissions, /"run:rerun"/);
  assert.match(permissions, /"finding:resolve"/);
  assert.match(permissions, /admin: workspacePermissions/);
  assert.match(permissions, /editor: \[[\s\S]*?"assertion:create"[\s\S]*?"run:rerun"[\s\S]*?"finding:resolve"/);
  assert.match(permissions, /viewer: \["workspace:read"\]/);
});

test("RAD-013 adds server-side workspace permission guards", async () => {
  await fileExists("src/lib/workspaces/guards.ts");

  const guards = await readWorkspaceFile("src/lib/workspaces/guards.ts");

  assert.match(guards, /server-only/);
  assert.match(guards, /WorkspacePermissionError/);
  assert.match(guards, /requireWorkspacePermission/);
  assert.match(guards, /getWorkspacePermissionContext/);
  assert.match(guards, /requireActiveWorkspace\(\)/);
  assert.match(guards, /membershipCan\(membership, permission\)/);
});

test("RAD-013 adds a UI-level permission gate with a clear denied state", async () => {
  await fileExists("src/components/workspaces/permission-gate.tsx");

  const gate = await readWorkspaceFile("src/components/workspaces/permission-gate.tsx");
  const topBar = await readWorkspaceFile("src/components/app-shell/top-bar.tsx");
  const appShell = await readWorkspaceFile("src/components/app-shell/app-shell.tsx");

  assert.match(gate, /WorkspacePermissionGate/);
  assert.match(gate, /PermissionDenied/);
  assert.match(gate, /membershipCan\(membership, permission\)/);
  assert.match(gate, /Your role cannot/);
  assert.match(topBar, /roleLabel/);
  assert.match(topBar, /membership\.role/);
  assert.match(appShell, /membership: RadarWorkspaceMembership/);
});

test("RAD-013 documents server checks as the source of truth", async () => {
  const securityDocs = await readWorkspaceFile("docs/SECURITY.md");

  assert.match(securityDocs, /Workspace RBAC/);
  assert.match(securityDocs, /Admin: read workspace data/);
  assert.match(securityDocs, /Editor: read workspace data/);
  assert.match(securityDocs, /Viewer: read workspace data only/);
  assert.match(securityDocs, /requireWorkspacePermission/);
  assert.match(securityDocs, /client-side checks are never the source of truth/);
});

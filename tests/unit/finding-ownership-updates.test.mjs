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

test("RAD-078 defines bounded finding owner teams", async () => {
  const schema = await readWorkspaceFile("src/lib/findings/schema.ts");

  assert.match(schema, /findingOwnerTeams = \["support", "product", "ops", "engineering"\]/);
  assert.match(schema, /FindingOwnerTeam/);
});

test("RAD-078 loads active workspace members for assignment choices", async () => {
  const workspaceSchema = await readWorkspaceFile("src/lib/workspaces/schema.ts");
  const workspaceRepository = await readWorkspaceFile("src/lib/repositories/workspaces.ts");

  assert.match(workspaceSchema, /RadarWorkspaceMember/);
  assert.match(workspaceRepository, /listActiveWorkspaceMembers/);
  assert.match(workspaceRepository, /\.from\("workspace_members"\)/);
  assert.match(workspaceRepository, /\.eq\("workspace_id", workspaceId\)/);
  assert.match(workspaceRepository, /\.eq\("status", "active"\)/);
});

test("RAD-078 persists owner priority and assignment history", async () => {
  const repository = await readWorkspaceFile("src/lib/repositories/findings.ts");

  assert.match(repository, /FindingOwnershipUpdateInput/);
  assert.match(repository, /updateFindingOwnership/);
  assert.match(repository, /owner_user_id: input\.ownerUserId \?\? null/);
  assert.match(repository, /severity: input\.severity/);
  assert.match(repository, /metadata: input\.metadata/);
  assert.match(repository, /closeActiveFindingAssignments/);
  assert.match(repository, /\.from\("finding_assignments"\)[\s\S]*?\.is\("unassigned_at", null\)/);
  assert.match(repository, /assignFinding/);
});

test("RAD-078 guards ownership updates with member validation activity and audit", async () => {
  const actions = await readWorkspaceFile("src/app/(app)/findings/actions.ts");

  assert.match(actions, /updateFindingOwnershipAction/);
  assert.match(actions, /permission: "finding:resolve"/);
  assert.match(actions, /listActiveWorkspaceMembers/);
  assert.match(actions, /Assignee must be an active member of this workspace/);
  assert.match(actions, /updateFindingOwnership/);
  assert.match(actions, /closeActiveFindingAssignments/);
  assert.match(actions, /assignFinding/);
  assert.match(actions, /activityType: ownerUserId \? "assigned" : "unassigned"/);
  assert.match(actions, /recordAuditEvent/);
  assert.match(actions, /workflowVersion: "rad-078"/);
});

test("RAD-078 renders ownership controls and team filters with shadcn primitives", async () => {
  await fileExists("src/components/findings/finding-ownership-form.tsx");

  const form = await readWorkspaceFile("src/components/findings/finding-ownership-form.tsx");
  const panel = await readWorkspaceFile("src/components/findings/finding-detail-panel.tsx");
  const inbox = await readWorkspaceFile("src/components/findings/finding-inbox.tsx");
  const page = await readWorkspaceFile("src/app/(app)/findings/page.tsx");

  assert.match(form, /FindingOwnershipForm/);
  assert.match(form, /useActionState/);
  assert.match(form, /updateFindingOwnershipAction/);
  assert.match(form, /@\/components\/ui\/select/);
  assert.match(form, /@\/components\/ui\/textarea/);
  assert.match(form, /Editor permission required/);
  assert.match(panel, /FindingOwnershipForm/);
  assert.match(panel, /ownerOptions/);
  assert.match(inbox, /name="team"/);
  assert.match(inbox, /formatOwnerTeam/);
  assert.match(page, /ownerTeamFromMetadata/);
  assert.match(page, /teamOptions/);
});

test("RAD-078 documents ownership workflow without adding unrelated scope", async () => {
  const dataModel = await readWorkspaceFile("docs/DATA_MODEL.md");
  const security = await readWorkspaceFile("docs/SECURITY.md");
  const task = await readWorkspaceFile("tasks/phase-7-findings-fixes/rad-078-add-assignment-and-ownership-updates.md");

  assert.match(dataModel, /RAD-078 stores operational ownership/);
  assert.match(security, /RAD-078 validates assignees/);
  assert.match(task, /Result: Done/);
});

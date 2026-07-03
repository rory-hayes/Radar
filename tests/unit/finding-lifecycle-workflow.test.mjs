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

test("RAD-077 adds a controlled finding lifecycle policy", async () => {
  await fileExists("src/lib/findings/lifecycle-workflow.ts");

  const workflow = await readWorkspaceFile("src/lib/findings/lifecycle-workflow.ts");

  assert.match(workflow, /server-only/);
  assert.match(workflow, /findingLifecycleWorkflowVersion = "rad-077"/);
  assert.match(workflow, /findingStatusTransitionMap/);
  assert.match(workflow, /open: \["investigating", "ignored", "false_positive"\]/);
  assert.match(workflow, /fixed: \["investigating", "resolved", "open"\]/);
  assert.match(workflow, /resolved: \["open"\]/);
  assert.match(workflow, /buildFindingLifecycleTransition/);
  assert.match(workflow, /noteRequiredStatuses/);
});

test("RAD-077 persists lifecycle transitions with resolution fields", async () => {
  const repository = await readWorkspaceFile("src/lib/repositories/findings.ts");
  const validation = await readWorkspaceFile("src/lib/validation/schemas.ts");

  assert.match(repository, /FindingStatusUpdateInput/);
  assert.match(repository, /resolved_at: parsedInput\.resolvedAt/);
  assert.match(repository, /resolved_by_user_id: parsedInput\.resolvedByUserId/);
  assert.match(repository, /resolution_summary: parsedInput\.resolutionSummary/);
  assert.match(repository, /clearResolution/);
  assert.match(validation, /resolvedAt: radarIsoDateTimeSchema\.optional\(\)/);
  assert.match(validation, /resolvedByUserId: radarIdSchema\.optional\(\)/);
  assert.match(validation, /resolutionSummary: z\.string\(\)\.trim\(\)\.max\(2000\)\.optional\(\)/);
});

test("RAD-077 adds a guarded server action with activity and audit events", async () => {
  await fileExists("src/app/(app)/findings/actions.ts");

  const actions = await readWorkspaceFile("src/app/(app)/findings/actions.ts");

  assert.match(actions, /updateFindingLifecycleAction/);
  assert.match(actions, /runWorkspaceServerAction/);
  assert.match(actions, /permission: "finding:resolve"/);
  assert.match(actions, /getFindingById/);
  assert.match(actions, /buildFindingLifecycleTransition/);
  assert.match(actions, /updateFindingStatus/);
  assert.match(actions, /recordFindingActivity/);
  assert.match(actions, /activityType: "status_changed"/);
  assert.match(actions, /recordAuditEvent/);
  assert.match(actions, /transition\.auditAction/);
  assert.match(actions, /revalidatePath\("\/findings"\)/);
});

test("RAD-077 renders lifecycle controls with shadcn primitives", async () => {
  await fileExists("src/components/findings/finding-lifecycle-form.tsx");

  const form = await readWorkspaceFile("src/components/findings/finding-lifecycle-form.tsx");
  const panel = await readWorkspaceFile("src/components/findings/finding-detail-panel.tsx");
  const page = await readWorkspaceFile("src/app/(app)/findings/page.tsx");

  assert.match(form, /useActionState/);
  assert.match(form, /updateFindingLifecycleAction/);
  assert.match(form, /@\/components\/ui\/select/);
  assert.match(form, /@\/components\/ui\/textarea/);
  assert.match(form, /@\/components\/ui\/alert/);
  assert.match(form, /SelectGroup/);
  assert.match(form, /Editor permission required/);
  assert.match(form, /Required when resolving, ignoring, or marking false positive/);
  assert.match(panel, /FindingLifecycleForm/);
  assert.match(panel, /allowedFindingStatusTargets\(finding\.status\)/);
  assert.match(page, /membershipCan\(membership, "finding:resolve"\)/);
});

test("RAD-077 documents lifecycle workflow without adding unrelated scope", async () => {
  const dataModel = await readWorkspaceFile("docs/DATA_MODEL.md");
  const security = await readWorkspaceFile("docs/SECURITY.md");
  const task = await readWorkspaceFile("tasks/phase-7-findings-fixes/rad-077-build-finding-lifecycle-workflow.md");

  assert.match(dataModel, /RAD-077 records finding lifecycle transitions/);
  assert.match(security, /RAD-077 requires `finding:resolve`/);
  assert.match(task, /Result: Done/);
});

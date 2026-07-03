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

test("RAD-042 adds assertion create and edit routes with loading states", async () => {
  for (const path of [
    "src/app/(app)/assertions/new/page.tsx",
    "src/app/(app)/assertions/new/loading.tsx",
    "src/app/(app)/assertions/[assertionId]/edit/page.tsx",
    "src/app/(app)/assertions/[assertionId]/edit/loading.tsx",
  ]) {
    await fileExists(path);
  }

  const newPage = await readWorkspaceFile("src/app/(app)/assertions/new/page.tsx");
  const editPage = await readWorkspaceFile("src/app/(app)/assertions/[assertionId]/edit/page.tsx");

  assert.match(newPage, /requireWorkspacePermission\("assertion:create"\)/);
  assert.match(newPage, /AssertionForm mode="create"/);
  assert.match(newPage, /listSources/);
  assert.match(editPage, /requireWorkspacePermission\("assertion:edit"\)/);
  assert.match(editPage, /getAssertionById/);
  assert.match(editPage, /listAssertionSourcesForAssertion/);
  assert.match(editPage, /listAssertionRunSchedules/);
  assert.match(editPage, /AssertionForm[\s\S]*mode="edit"/);
});

test("RAD-042 form captures assertion definition schedule owner and evidence sources", async () => {
  const form = await readWorkspaceFile("src/components/assertions/assertion-form.tsx");

  for (const fieldName of [
    "title",
    "purpose",
    "expectedBehavior",
    "category",
    "priority",
    "runnerType",
    "status",
    "ownerUserId",
    "scheduleCadence",
    "scheduleEnabled",
    "sourceChangeTrigger",
    "timezone",
    "sourceIds",
  ]) {
    assert.match(form, new RegExp(`name="${fieldName}"`));
  }

  assert.match(form, /FieldGroup/);
  assert.match(form, /FieldSet/);
  assert.match(form, /SelectGroup/);
  assert.match(form, /Textarea/);
  assert.match(form, /Alert variant="destructive"/);
  assert.match(form, /Define the customer-facing business truth first/);
});

test("RAD-042 server actions persist assertion schedule and source links with RBAC", async () => {
  const actions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");
  const repository = await readWorkspaceFile("src/lib/repositories/assertions.ts");

  assert.match(actions, /export async function createAssertionAction/);
  assert.match(actions, /export async function updateAssertionAction/);
  assert.match(actions, /permission: "assertion:create"/);
  assert.match(actions, /permission: "assertion:edit"/);
  assert.match(actions, /createAssertion/);
  assert.match(actions, /updateAssertion/);
  assert.match(actions, /replaceAssertionSourcesForAssertion/);
  assert.match(actions, /upsertAssertionRunSchedule/);
  assert.match(actions, /revalidatePath\("\/assertions"\)/);
  assert.match(repository, /export async function replaceAssertionSourcesForAssertion/);
  assert.match(repository, /\.eq\("workspace_id", workspaceId\)/);
  assert.match(repository, /relationshipType: "manual"/);
});

test("RAD-042 wires assertions table create and edit affordances without scope drift", async () => {
  const page = await readWorkspaceFile("src/app/(app)/assertions/page.tsx");
  const table = await readWorkspaceFile("src/components/assertions/assertion-table.tsx");
  const task = await readWorkspaceFile("tasks/phase-4-assertions-testcases/rad-042-build-assertion-create-and-edit-flow.md");

  assert.match(page, /membershipCan\(membership, "assertion:create"\)/);
  assert.match(page, /href="\/assertions\/new"/);
  assert.match(page, /Create assertion/);
  assert.match(table, /href=\{`\/assertions\/\$\{assertion\.id\}\/edit`\}/);
  assert.match(table, /canEdit/);
  assert.match(task, /forms\/drawers|Create forms/);

  for (const source of [page, table]) {
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace/i);
    assert.doesNotMatch(source, /service_role|sb_secret/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});

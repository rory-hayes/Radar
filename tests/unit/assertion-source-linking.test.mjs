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

test("RAD-044 adds source coverage rules for each runner type", async () => {
  await fileExists("src/lib/assertions/source-coverage.ts");

  const coverage = await readWorkspaceFile("src/lib/assertions/source-coverage.ts");

  assert.match(coverage, /sourceCoverageRequirementsForAssertion/);
  assert.match(coverage, /getAssertionSourceCoverage/);
  assert.match(coverage, /isAssertionSourceCoverageMet/);
  assert.match(coverage, /runnerType === "journey"/);
  assert.match(coverage, /runnerType === "integration"/);
  assert.match(coverage, /knowledgeSourceTypes/);
  assert.match(coverage, /journeySourceTypes/);
  assert.match(coverage, /integrationSourceTypes/);
});

test("RAD-044 exposes a guarded server action for assertion source links", async () => {
  const actions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");
  const repository = await readWorkspaceFile("src/lib/repositories/assertions.ts");

  assert.match(actions, /export async function updateAssertionSourceLinksAction/);
  assert.match(actions, /permission: "assertion:edit"/);
  assert.match(actions, /assertionSourceLinksActionSchema/);
  assert.match(actions, /getAssertionById/);
  assert.match(actions, /listSources/);
  assert.match(actions, /replaceAssertionSourcesForAssertion/);
  assert.match(actions, /revalidatePath\("\/assertions"\)/);
  assert.match(actions, /revalidatePath\(`\/assertions\/\$\{String/);
  assert.match(repository, /export async function replaceAssertionSourcesForAssertion/);
  assert.match(repository, /\.eq\("workspace_id", workspaceId\)/);
});

test("RAD-044 renders an editable minimum source coverage panel on assertion detail", async () => {
  await fileExists("src/components/assertions/assertion-source-linking-panel.tsx");

  const page = await readWorkspaceFile("src/app/(app)/assertions/[assertionId]/page.tsx");
  const detail = await readWorkspaceFile("src/components/assertions/assertion-detail.tsx");
  const panel = await readWorkspaceFile("src/components/assertions/assertion-source-linking-panel.tsx");

  assert.match(page, /availableSources=\{detail\.availableSources\}/);
  assert.match(page, /canEditSources=\{canEditAssertion\}/);
  assert.match(detail, /AssertionSourceLinkingPanel/);
  assert.match(detail, /LinkedSourceTable/);
  assert.match(panel, /useActionState/);
  assert.match(panel, /updateAssertionSourceLinksAction/);
  assert.match(panel, /Minimum source coverage/);
  assert.match(panel, /name="sourceIds"/);
  assert.match(panel, /Save source links/);
  assert.match(panel, /Viewers can inspect source coverage/);
});

test("RAD-044 keeps source linking assertion-led and template-free", async () => {
  const panel = await readWorkspaceFile("src/components/assertions/assertion-source-linking-panel.tsx");
  const task = await readWorkspaceFile("tasks/phase-4-assertions-testcases/rad-044-implement-assertion-source-linking.md");

  assert.match(panel, /Attach only the sources this assertion needs/);
  assert.match(panel, /Select at least one source that satisfies the required coverage above/);
  assert.match(task, /minimum required source coverage/);

  for (const source of [panel]) {
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace/i);
    assert.doesNotMatch(source, /service_role|sb_secret/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});

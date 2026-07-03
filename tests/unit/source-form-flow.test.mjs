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

test("RAD-032 adds guarded source create and edit server actions", async () => {
  const actions = await readWorkspaceFile("src/app/(app)/sources/actions.ts");

  assert.match(actions, /"use server"/);
  assert.match(actions, /runWorkspaceServerAction/);
  assert.match(actions, /permission: "source:create"/);
  assert.match(actions, /permission: "source:edit"/);
  assert.match(actions, /createSource\(supabase, membership\.workspace\.id, user\.id/);
  assert.match(actions, /updateSource\(supabase, membership\.workspace\.id, input\.sourceId/);
  assert.match(actions, /sourceFormActionSchema/);
  assert.match(actions, /isValidHttpUrl/);
  assert.match(actions, /Manual text sources need at least 20 characters/);
  assert.match(actions, /Attach a file or enter a document reference/);
  assert.match(actions, /maxUploadBytes/);
  assert.match(actions, /revalidatePath\("\/sources"\)/);
  assert.match(actions, /redirect\("\/sources"\)/);
  assert.doesNotMatch(actions, /apiKey|password|secret|token/i);
});

test("RAD-032 composes the source form with shadcn field primitives and source-specific controls", async () => {
  const form = await readWorkspaceFile("src/components/sources/source-form.tsx");
  const barrel = await readWorkspaceFile("src/components/sources/index.ts");

  assert.match(form, /useActionState/);
  assert.match(form, /FieldGroup/);
  assert.match(form, /FieldLabel/);
  assert.match(form, /SelectGroup/);
  assert.match(form, /Input/);
  assert.match(form, /Textarea/);
  assert.match(form, /Alert variant="destructive"/);
  assert.match(form, /name="uploadedFile"/);
  assert.match(form, /name="manualText"/);
  assert.match(form, /name="endpointMethod"/);
  assert.match(form, /name="endpointAuthMode"/);
  assert.match(form, /input type="hidden" name="sourceId"/);
  assert.match(form, /input type="hidden" name="type"/);
  assert.match(form, /createSourceAction/);
  assert.match(form, /updateSourceAction/);
  assert.match(barrel, /SourceForm/);
  assert.doesNotMatch(form, /integration marketplace|prompt playground|trace explorer|workflow canvas/i);
});

test("RAD-032 adds scoped source create and edit routes without changing primary navigation", async () => {
  for (const path of [
    "src/app/(app)/sources/new/page.tsx",
    "src/app/(app)/sources/[sourceId]/edit/page.tsx",
  ]) {
    await fileExists(path);
  }

  const newPage = await readWorkspaceFile("src/app/(app)/sources/new/page.tsx");
  const editPage = await readWorkspaceFile("src/app/(app)/sources/[sourceId]/edit/page.tsx");
  const routes = await readWorkspaceFile("src/lib/radar-routes.ts");

  assert.match(newPage, /SourceForm mode="create"/);
  assert.match(newPage, /PageHeader/);
  assert.match(newPage, /href="\/sources"/);
  assert.match(editPage, /requireActiveWorkspace\(\)/);
  assert.match(editPage, /createSupabaseServerClient\(\)/);
  assert.match(editPage, /getSourceById\(supabase, membership\.workspace\.id, sourceId\)/);
  assert.match(editPage, /notFound\(\)/);
  assert.match(editPage, /SourceForm mode="edit"/);
  assert.doesNotMatch(routes, /sources\/new|sourceId|edit source/i);
});

test("RAD-032 wires Sources page create and edit affordances through RBAC", async () => {
  const page = await readWorkspaceFile("src/app/(app)/sources/page.tsx");
  const sourceCard = await readWorkspaceFile("src/components/sources/source-card.tsx");
  const sourceList = await readWorkspaceFile("src/components/sources/source-list.tsx");
  const repository = await readWorkspaceFile("src/lib/repositories/sources.ts");

  assert.match(page, /membershipCan\(membership, "source:create"\)/);
  assert.match(page, /membershipCan\(membership, "source:edit"\)/);
  assert.match(page, /href="\/sources\/new"/);
  assert.match(page, /canEdit={canEditSource}/);
  assert.match(sourceCard, /canEdit/);
  assert.match(sourceCard, /\/sources\/\$\{source\.id\}\/edit/);
  assert.match(sourceList, /canEdit/);
  assert.match(sourceList, /\/sources\/\$\{source\.id\}\/edit/);
  assert.match(repository, /const updatePayload: Record<string, unknown> = \{\}/);
  assert.match(repository, /parsedInput\.config !== undefined/);
  assert.match(repository, /\.update\(updatePayload\)/);
});

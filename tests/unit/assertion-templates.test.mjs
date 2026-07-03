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

const requiredPackSlugs = [
  "pricing-plan-accuracy",
  "refund-cancellation",
  "trial-onboarding",
  "billing-invoices",
  "support-escalation",
];

test("RAD-045 defines the five V1 assertion packs in runtime code", async () => {
  await fileExists("src/lib/assertions/templates.ts");

  const templates = await readWorkspaceFile("src/lib/assertions/templates.ts");

  for (const slug of requiredPackSlugs) {
    assert.match(templates, new RegExp(`slug: "${slug}"`));
  }

  assert.match(templates, /Pricing & Plan Accuracy/);
  assert.match(templates, /Refund & Cancellation/);
  assert.match(templates, /Trial & Onboarding/);
  assert.match(templates, /Billing & Invoices/);
  assert.match(templates, /Support Escalation/);
  assert.match(templates, /requiredSourceTypes/);
  assert.match(templates, /testCaseBlueprints/);
  assert.match(templates, /getV1AssertionTemplate/);
});

test("RAD-045 seeds V1 packs as system assertion templates", async () => {
  const migration = await readWorkspaceFile("supabase/migrations/20260703113500_seed_v1_assertion_templates.sql");

  assert.match(migration, /insert into public\.assertion_templates/);
  assert.match(migration, /is_system/);
  assert.match(migration, /null,\n    'Pricing & Plan Accuracy'/);
  assert.match(migration, /"pack":"v1"/);
  assert.match(migration, /on conflict \(id\) do update/);

  for (const slug of requiredPackSlugs) {
    assert.match(migration, new RegExp(`"slug":"${slug}"`));
  }

  assert.match(migration, /array\['url', 'uploaded_document', 'manual_text'\]::public\.source_type\[\]/);
  assert.match(migration, /array\['api_endpoint', 'support_bot_endpoint'\]::public\.source_type\[\]/);
  assert.doesNotMatch(migration, /workspace_id,\n[\s\S]*'20000000-0000-4000-8000-000000000001'/);
});

test("RAD-045 lets the create assertion page start from a selected pack", async () => {
  const page = await readWorkspaceFile("src/app/(app)/assertions/new/page.tsx");
  const form = await readWorkspaceFile("src/components/assertions/assertion-form.tsx");
  const picker = await readWorkspaceFile("src/components/assertions/assertion-template-picker.tsx");

  assert.match(page, /searchParams/);
  assert.match(page, /templateSlugFromSearchParams/);
  assert.match(page, /getV1AssertionTemplate/);
  assert.match(page, /AssertionTemplatePicker/);
  assert.match(page, /title: selectedTemplate\.titleTemplate/);
  assert.match(page, /purpose: selectedTemplate\.purposeTemplate/);
  assert.match(page, /expectedBehavior: selectedTemplate\.expectedBehaviorTemplate/);
  assert.match(form, /template\?: AssertionFormTemplateDefaults/);
  assert.match(form, /defaultValue=\{assertion\?\.title \?\? template\?\.title\}/);
  assert.match(picker, /href=\{`\/assertions\/new\?template=\$\{template\.slug\}`\}/);
  assert.match(picker, /Use pack/);
});

test("RAD-045 keeps templates business-focused and out of generic eval scope", async () => {
  const templates = await readWorkspaceFile("src/lib/assertions/templates.ts");
  const picker = await readWorkspaceFile("src/components/assertions/assertion-template-picker.tsx");
  const task = await readWorkspaceFile("tasks/phase-4-assertions-testcases/rad-045-create-first-assertion-packs-and-templates.md");

  assert.match(task, /Pricing & Plan Accuracy/);

  for (const source of [templates, picker]) {
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace/i);
    assert.doesNotMatch(source, /service_role|sb_secret/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});

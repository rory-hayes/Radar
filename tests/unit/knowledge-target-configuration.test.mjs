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

test("RAD-054 adds a server-only Knowledge target configuration loader", async () => {
  await fileExists("src/lib/evaluation/knowledge-targets.ts");

  const targets = await readWorkspaceFile("src/lib/evaluation/knowledge-targets.ts");

  assert.match(targets, /server-only/);
  assert.match(targets, /export async function loadKnowledgeTargetConfigurationsForAssertion/);
  assert.match(targets, /KnowledgeTargetConfigurationSet/);
  assert.match(targets, /KnowledgeTargetConfigurationError/);
  assert.match(targets, /getAssertionById/);
  assert.match(targets, /listAssertionSourcesForAssertion/);
  assert.match(targets, /listSourceSyncTargetsForWorkspace/);
});

test("RAD-054 classifies endpoint and answer-set source targets for Knowledge Runner", async () => {
  const targets = await readWorkspaceFile("src/lib/evaluation/knowledge-targets.ts");

  assert.match(targets, /support_bot_endpoint[\s\S]*ai_support_endpoint/);
  assert.match(targets, /api_endpoint[\s\S]*http_endpoint/);
  assert.match(targets, /uploaded_document[\s\S]*uploaded_answer_set/);
  assert.match(targets, /manual_text[\s\S]*manual_answer_set/);
  assert.match(targets, /assertion\.runnerType !== "knowledge"/);
  assert.match(targets, /isKnowledgeRunner: true/);
});

test("RAD-054 validates target readiness without storing runner secrets", async () => {
  const targets = await readWorkspaceFile("src/lib/evaluation/knowledge-targets.ts");
  const repository = await readWorkspaceFile("src/lib/repositories/sources.ts");

  assert.match(targets, /needs_endpoint_url/);
  assert.match(targets, /needs_synced_content/);
  assert.match(targets, /sync_error/);
  assert.match(targets, /source\.originUri/);
  assert.match(targets, /httpMethodFromConfig/);
  assert.match(targets, /authModeFromConfig/);
  assert.match(repository, /export async function listSourceSyncTargetsForWorkspace/);
  assert.match(repository, /\.eq\("workspace_id", workspaceId\)/);
  assert.match(repository, /\.in\("id", uniqueSourceIds\)/);

  for (const source of [targets, repository]) {
    assert.doesNotMatch(source, /apiKey|secretKey|accessToken|refreshToken|service_role|sb_secret/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});

test("RAD-054 exposes target configuration on assertion detail with approved primitives", async () => {
  const page = await readWorkspaceFile("src/app/(app)/assertions/[assertionId]/page.tsx");
  const detail = await readWorkspaceFile("src/components/assertions/assertion-detail.tsx");
  const panel = await readWorkspaceFile("src/components/assertions/knowledge-target-configuration-panel.tsx");

  assert.match(page, /loadKnowledgeTargetConfigurationsForAssertion/);
  assert.match(page, /knowledgeTargets=\{detail\.knowledgeTargets\}/);
  assert.match(detail, /KnowledgeTargetConfigurationPanel/);
  assert.match(detail, /knowledgeTargets/);
  assert.match(panel, /No Knowledge Runner target configured/);
  assert.match(panel, /Knowledge target configuration/);
  assert.match(panel, /Card/);
  assert.match(panel, /Table/);
  assert.match(panel, /Alert/);
  assert.match(panel, /StatusBadge/);
  assert.match(panel, /href="\/sources\/new"/);
  assert.match(panel, /\/sources\/\$\{target\.sourceId\}\/edit/);
});

test("RAD-054 documents the assertion-led target boundary", async () => {
  const evalSpec = await readWorkspaceFile("docs/EVAL_ENGINE_SPEC.md");
  const sourcesEvidence = await readWorkspaceFile("docs/SOURCES_AND_EVIDENCE.md");
  const task = await readWorkspaceFile("tasks/phase-5-eval-knowledge-runner/rad-054-build-target-endpoint-configuration.md");
  const targets = await readWorkspaceFile("src/lib/evaluation/knowledge-targets.ts");
  const panel = await readWorkspaceFile("src/components/assertions/knowledge-target-configuration-panel.tsx");

  assert.match(evalSpec, /RAD-054/);
  assert.match(evalSpec, /Knowledge target configuration/);
  assert.match(sourcesEvidence, /support bot endpoint/);
  assert.match(sourcesEvidence, /uploaded answer set/);
  assert.match(task, /No new shadcn block was installed/);

  for (const source of [targets, panel]) {
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace|model comparison/i);
  }
});

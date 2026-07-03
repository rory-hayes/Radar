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

test("RAD-074 adds a Radar-owned EvidenceDiff component", async () => {
  await fileExists("src/components/radar/evidence-diff.tsx");

  const diff = await readWorkspaceFile("src/components/radar/evidence-diff.tsx");
  const barrel = await readWorkspaceFile("src/components/radar/index.ts");

  assert.match(diff, /EvidenceDiff/);
  assert.match(diff, /Source \/ policy excerpt/);
  assert.match(diff, /Actual answer or result/);
  assert.match(diff, /Missing from actual/);
  assert.match(diff, /Unsupported in source/);
  assert.match(diff, /highlightText/);
  assert.match(barrel, /EvidenceDiff/);
});

test("RAD-074 highlights mismatches with semantic Radar tokens and citations", async () => {
  const diff = await readWorkspaceFile("src/components/radar/evidence-diff.tsx");

  assert.match(diff, /contentTokenSet/);
  assert.match(diff, /normalizedToken/);
  assert.match(diff, /stopWords/);
  assert.match(diff, /<mark/);
  assert.match(diff, /var\(--radar-status-warning-bg\)/);
  assert.match(diff, /var\(--radar-status-fail-bg\)/);
  assert.match(diff, /citation \? <Badge variant="outline">/);
  assert.match(diff, /confidenceLabel \? <Badge variant="secondary">/);
});

test("RAD-074 renders EvidenceDiff inside the finding detail evidence section", async () => {
  const panel = await readWorkspaceFile("src/components/findings/finding-detail-panel.tsx");

  assert.match(panel, /EvidenceDiff/);
  assert.match(panel, /sourceText=\{evidenceText\(item, finding\.expected\)\}/);
  assert.match(panel, /actualText=\{finding\.actual\}/);
  assert.match(panel, /citation=\{item\.citation\}/);
  assert.match(panel, /evidenceText/);
  assert.doesNotMatch(panel, /EvidenceSnippet/);
});

test("RAD-074 documents diff highlighting without adding generic diff scope", async () => {
  const uxSystem = await readWorkspaceFile("docs/UX_SYSTEM.md");
  const diff = await readWorkspaceFile("src/components/radar/evidence-diff.tsx");

  assert.match(uxSystem, /RAD-074 adds `EvidenceDiff`/);
  assert.match(uxSystem, /source terms missing from the actual output/);
  assert.match(uxSystem, /actual terms unsupported by the source excerpt/);
  assert.doesNotMatch(diff, /prompt playground|trace explorer|workflow canvas|integration marketplace|model comparison/i);
  assert.doesNotMatch(diff, /monaco|diff2html|code mirror|unified diff/i);
});

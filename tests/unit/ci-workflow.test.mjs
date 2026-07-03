import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ciWorkflow = await readFile(".github/workflows/ci.yml", "utf8");

test("RAD-005 runs the required CI quality gates", () => {
  for (const command of [
    "pnpm install --frozen-lockfile",
    "pnpm validate:env",
    "pnpm validate:seed",
    "pnpm lint",
    "pnpm typecheck",
    "pnpm test",
    "pnpm test:e2e",
    "pnpm build",
  ]) {
    assert.match(ciWorkflow, new RegExp(command.replaceAll(" ", "\\s+")));
  }
});

test("RAD-005 keeps CI local-safe and native-binary-safe", () => {
  assert.match(ciWorkflow, /RADAR_ENV:\s+local/);
  assert.match(ciWorkflow, /NAPI_RS_FORCE_WASI:\s+"true"/);
  assert.match(ciWorkflow, /node-version:\s+24/);
  assert.match(ciWorkflow, /version:\s+11\.7\.0/);
});

test("RAD-005 limits workflow permissions and duplicate runs", () => {
  assert.match(ciWorkflow, /permissions:\n\s+contents:\s+read/);
  assert.match(ciWorkflow, /cancel-in-progress:\s+true/);
});

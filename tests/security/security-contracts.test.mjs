import { execFileSync } from "child_process";
import { readFileSync } from "fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "path";

const repoRoot = process.cwd();

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("server OpenAI secret helper is server-only and not barrel-exported", () => {
  const serverSecrets = read("src/lib/security/server-secrets.ts");
  const securityIndex = read("src/lib/security/index.ts");

  assert.match(serverSecrets, /import "server-only";/);
  assert.match(serverSecrets, /OPENAI_API_KEY/);
  assert.doesNotMatch(securityIndex, /server-secrets/);
});

test("tenant role map includes production roles and bounded viewer permissions", () => {
  const permissions = read("src/lib/tenant/permissions.ts");

  for (const role of ["owner", "admin", "security", "analyst", "agent", "viewer"]) {
    assert.match(permissions, new RegExp(`${role}: \\[`));
  }

  const viewerBlock = permissions.match(/viewer: \[([\s\S]*?)\]/)?.[1] ?? "";
  assert.match(viewerBlock, /"tenant:read"/);
  assert.doesNotMatch(viewerBlock, /"source:write"/);
  assert.doesNotMatch(viewerBlock, /"audit:read"/);
});

test("security scanners pass the current source tree", () => {
  execFileSync(process.execPath, ["scripts/no-dummy-data-scan.mjs", "src"], {
    cwd: repoRoot,
    stdio: "pipe",
  });
  execFileSync(process.execPath, ["scripts/secret-client-key-scan.mjs"], {
    cwd: repoRoot,
    stdio: "pipe",
  });
});

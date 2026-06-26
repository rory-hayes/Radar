import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const loader = resolve(root, "scripts/ts-paths-loader.mjs");
const evalDir = resolve(root, "tests/evals");
const testFiles = readdirSync(evalDir)
  .filter((file) => file.endsWith(".test.ts"))
  .sort()
  .map((file) => resolve(evalDir, file));

if (testFiles.length === 0) {
  console.error("No eval tests found.");
  process.exit(1);
}

for (const testFile of testFiles) {
  const result = spawnSync(
    process.execPath,
    ["--loader", loader, testFile],
    {
      cwd: root,
      env: {
        ...process.env,
        NODE_NO_WARNINGS: "1",
      },
      stdio: "inherit",
    },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`Radar eval tests passed (${testFiles.length} files).`);

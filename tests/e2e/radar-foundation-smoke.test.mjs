import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-001 defines the required local development and quality scripts", async () => {
  const packageJson = JSON.parse(await readWorkspaceFile("package.json"));

  assert.deepEqual(
    {
      dev: packageJson.scripts.dev,
      build: packageJson.scripts.build,
      start: packageJson.scripts.start,
      lint: packageJson.scripts.lint,
      typecheck: packageJson.scripts.typecheck,
      test: packageJson.scripts.test,
      "test:e2e": packageJson.scripts["test:e2e"],
    },
    {
      dev: "NAPI_RS_FORCE_WASI=true next dev --webpack",
      build: "NAPI_RS_FORCE_WASI=true next build --webpack",
      start: "next start",
      lint: "eslint .",
      typecheck: "NAPI_RS_FORCE_WASI=true next typegen && tsc --noEmit",
      test: "node --test tests/unit/*.test.mjs",
      "test:e2e": "node --test tests/e2e/*.test.mjs",
    },
  );
});

test("RAD-001 keeps the placeholder tied to Radar's assertion-led scope", async () => {
  const pageSource = await readWorkspaceFile("src/app/page.tsx");

  assert.match(pageSource, /customer-facing business still works/);
  assert.match(pageSource, /assertion-led product work/);
  assert.match(pageSource, /corePages\.map/);
  assert.doesNotMatch(pageSource, /Prompt Playground/);
  assert.doesNotMatch(pageSource, /Trace Explorer/);
});

test("RAD-001 has baseline route states without adding product routes early", async () => {
  const loadingSource = await readWorkspaceFile("src/app/loading.tsx");
  const errorSource = await readWorkspaceFile("src/app/error.tsx");
  const notFoundSource = await readWorkspaceFile("src/app/not-found.tsx");

  assert.match(loadingSource, /Loading Radar/);
  assert.match(errorSource, /Radar could not load/);
  assert.match(notFoundSource, /Page not found/);
});

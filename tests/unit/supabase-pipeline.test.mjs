import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function fileExists(relativePath) {
  await access(relativePath);
  return true;
}

test("RAD-006 pins the Supabase CLI and exposes local database scripts", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));

  assert.equal(packageJson.devDependencies.supabase, "2.109.0");
  assert.deepEqual(
    {
      "supabase:start": packageJson.scripts["supabase:start"],
      "supabase:stop": packageJson.scripts["supabase:stop"],
      "supabase:status": packageJson.scripts["supabase:status"],
      "supabase:reset": packageJson.scripts["supabase:reset"],
      "supabase:migration:new": packageJson.scripts["supabase:migration:new"],
      "db:reset": packageJson.scripts["db:reset"],
    },
    {
      "supabase:start": "supabase start",
      "supabase:stop": "supabase stop",
      "supabase:status": "supabase status",
      "supabase:reset": "supabase db reset --local",
      "supabase:migration:new": "supabase migration new",
      "db:reset": "pnpm supabase:reset",
    },
  );
});

test("RAD-006 configures local migrations and seed loading", async () => {
  const configToml = await readFile("supabase/config.toml", "utf8");

  assert.match(configToml, /project_id = "radar"/);
  assert.match(configToml, /\[db\.migrations\]\n# If disabled,[\s\S]*?enabled = true/);
  assert.match(configToml, /\[db\.seed\]\n# If enabled,[\s\S]*?enabled = true/);
  assert.match(configToml, /sql_paths = \["\.\/seed\.sql"\]/);
  assert.match(configToml, /major_version = 17/);
  assert.match(configToml, /site_url = "http:\/\/localhost:3000"/);

  await fileExists("supabase/seed.sql");
  await fileExists("supabase/migrations/README.md");
});

test("RAD-006 documents workspace-safe migration and seed conventions", async () => {
  const localDocs = await readFile("docs/SUPABASE_LOCAL_DEVELOPMENT.md", "utf8");
  const migrationReadme = await readFile("supabase/migrations/README.md", "utf8");
  const seedSql = await readFile("supabase/seed.sql", "utf8");

  assert.match(localDocs, /pnpm supabase:start/);
  assert.match(localDocs, /pnpm db:reset/);
  assert.match(localDocs, /NEXT_PUBLIC_SUPABASE_URL=http:\/\/127\.0\.0\.1:54321/);
  assert.match(localDocs, /Do not commit those values/);
  assert.match(localDocs, /SUPABASE_SERVICE_ROLE_KEY` server-only/);
  assert.match(migrationReadme, /workspace_id/);
  assert.match(migrationReadme, /Enable RLS/);
  assert.match(migrationReadme, /Do not store raw runner credentials/);
  assert.doesNotMatch(seedSql, /\bINSERT\s+INTO\b/i);
});

import { spawnSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const applyMigrations = process.argv.includes("--apply");

const migrationsDir = "supabase/migrations";
const seedEntrypoint = "supabase/seed.sql";
const demoSeed = "supabase/seeds/radar-demo-workspace.sql";

const requiredMigrations = [
  "20260703090000_create_workspaces_and_memberships.sql",
  "20260703093000_add_workspace_settings_fields.sql",
  "20260703100000_create_audit_logs.sql",
  "20260703103000_create_sources_documents_chunks.sql",
  "20260703104000_create_assertions_and_test_cases.sql",
  "20260703105000_create_evaluation_runs_and_results.sql",
  "20260703110000_create_findings_and_evidence.sql",
  "20260703111500_harden_workspace_rls_policies.sql",
  "20260703112000_configure_evidence_artifact_storage.sql",
];

const workspaceOwnedTables = [
  "sources",
  "source_versions",
  "source_documents",
  "source_chunks",
  "assertions",
  "assertion_sources",
  "assertion_runs_schedule",
  "test_cases",
  "evaluation_runs",
  "test_case_results",
  "findings",
  "finding_evidence",
  "finding_assignments",
  "finding_activity",
];

const representativeSeedTables = [
  "public.workspaces",
  "public.workspace_members",
  "public.sources",
  "public.source_versions",
  "public.source_documents",
  "public.source_chunks",
  "public.assertions",
  "public.assertion_sources",
  "public.assertion_runs_schedule",
  "public.test_cases",
  "public.assertion_templates",
  "public.evaluation_runs",
  "public.test_case_results",
  "public.findings",
  "public.finding_evidence",
  "public.finding_assignments",
  "public.finding_activity",
  "public.audit_logs",
];

const failures = [];

if (applyMigrations) {
  run("pnpm", ["supabase:reset"]);
  run("pnpm", ["validate:seed"]);
}

const migrationFiles = await readdir(migrationsDir);
const sqlMigrationFiles = migrationFiles.filter((file) => file.endsWith(".sql")).sort();
const combinedMigrations = await readMany(sqlMigrationFiles.map((file) => path.join(migrationsDir, file)));
const seedEntrypointSql = await readRequired(seedEntrypoint);
const demoSeedSql = await readRequired(demoSeed);

verifyMigrationOrder(sqlMigrationFiles);
verifyRequiredMigrations(sqlMigrationFiles);
verifySchemaConstraintsAndIndexes(combinedMigrations);
verifyWorkspaceRls(combinedMigrations);
verifyStorageBucket(combinedMigrations);
verifySeedCoverage(seedEntrypointSql, demoSeedSql);
verifyForbiddenSeedPatterns(demoSeedSql);

if (failures.length > 0) {
  console.error("Radar database harness validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  applyMigrations
    ? "Radar database harness applied migrations, seeded data, and passed validation."
    : "Radar database harness static validation passed. Use `pnpm db:harness:apply` when Docker is running.",
);

async function readMany(filePaths) {
  const contents = await Promise.all(filePaths.map((filePath) => readRequired(filePath)));
  return contents.join("\n\n");
}

async function readRequired(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    failures.push(`${filePath}: missing required database harness file`);
    return "";
  }
}

function verifyMigrationOrder(files) {
  const timestamps = new Set();

  for (const file of files) {
    if (!/^\d{14}_[a-z0-9_]+\.sql$/.test(file)) {
      failures.push(`${file}: migration filename must start with a 14-digit timestamp and snake_case name`);
    }

    const timestamp = file.slice(0, 14);
    if (timestamps.has(timestamp)) {
      failures.push(`${file}: migration timestamp is duplicated`);
    }
    timestamps.add(timestamp);
  }

  const sorted = [...files].sort();
  if (files.join("\n") !== sorted.join("\n")) {
    failures.push(`${migrationsDir}: migrations must sort in execution order`);
  }
}

function verifyRequiredMigrations(files) {
  for (const requiredMigration of requiredMigrations) {
    if (!files.includes(requiredMigration)) {
      failures.push(`${migrationsDir}: missing ${requiredMigration}`);
    }
  }
}

function verifySchemaConstraintsAndIndexes(sql) {
  for (const table of workspaceOwnedTables) {
    assertIncludes(sql, `create table public.${table}`, `${table}: missing table`);
    assertIncludes(sql, "workspace_id uuid not null references public.workspaces", `${table}: missing workspace ownership`);
  }

  for (const requiredSnippet of [
    "constraint sources_hash_length",
    "constraint source_versions_workspace_source_unique",
    "constraint assertions_workspace_id_id_unique unique (workspace_id, id)",
    "constraint evaluation_runs_workspace_assertion_fk",
    "constraint test_case_results_workspace_run_fk",
    "constraint findings_workspace_dedupe_unique",
    "constraint finding_evidence_workspace_chunk_fk",
    "create index sources_workspace_status_idx",
    "create index assertions_workspace_status_idx",
    "create index evaluation_runs_workspace_status_idx",
    "create index findings_workspace_status_idx",
  ]) {
    assertIncludes(sql, requiredSnippet, `schema: missing ${requiredSnippet}`);
  }
}

function verifyWorkspaceRls(sql) {
  for (const table of ["workspaces", "workspace_members", "audit_logs", ...workspaceOwnedTables]) {
    assertIncludes(sql, `alter table public.${table} enable row level security`, `${table}: missing RLS enablement`);
  }

  for (const table of ["workspaces", "workspace_members", "audit_logs", ...workspaceOwnedTables]) {
    assertIncludes(sql, `alter table public.${table} force row level security`, `${table}: missing forced RLS`);
  }

  for (const requiredSnippet of [
    "current_user_is_workspace_member",
    "current_user_can_edit_workspace",
    "current_user_is_workspace_admin",
    "workspace members can read sources",
    "workspace editors can create assertions",
    "workspace admins can delete evaluation runs",
    "workspace editors can manage finding evidence",
  ]) {
    assertIncludes(sql, requiredSnippet, `RLS: missing ${requiredSnippet}`);
  }
}

function verifyStorageBucket(sql) {
  for (const requiredSnippet of [
    "insert into storage.buckets",
    "'radar-evidence-artifacts'",
    "public = false",
    "file_size_limit = excluded.file_size_limit",
    "workspace members can read evidence artifacts",
    "workspace editors can create evidence artifacts",
    "workspace admins can delete evidence artifacts",
  ]) {
    assertIncludes(sql, requiredSnippet, `storage: missing ${requiredSnippet}`);
  }
}

function verifySeedCoverage(seedSql, demoSql) {
  assertIncludes(seedSql, "RADAR_LOCAL_SEED_CONTRACT", "seed entrypoint: missing contract marker");
  assertIncludes(seedSql, "radar-demo-workspace.sql", "seed entrypoint: missing demo seed include");

  for (const table of representativeSeedTables) {
    assertIncludes(demoSql, table, `demo seed: missing representative ${table} records`);
  }

  for (const requiredSnippet of [
    "radar-demo-workspace",
    "20000000-0000-4000-8000-000000000001",
    "source.created",
    "assertion.created",
    "run.rerun_requested",
    "finding.updated",
    "workspace_id",
  ]) {
    assertIncludes(demoSql, requiredSnippet, `demo seed: missing ${requiredSnippet}`);
  }
}

function verifyForbiddenSeedPatterns(seedSql) {
  for (const pattern of [
    /sk_(live|test)_[A-Za-z0-9]/,
    /whsec_[A-Za-z0-9]/,
    /service_role/i,
    /BEGIN\s+PRIVATE\s+KEY/,
    /\bhttps?:\/\//i,
  ]) {
    if (pattern.test(seedSql)) {
      failures.push(`demo seed: contains forbidden secret-like pattern ${pattern}`);
    }
  }
}

function assertIncludes(contents, requiredSnippet, failureMessage) {
  if (!contents.includes(requiredSnippet)) {
    failures.push(failureMessage);
  }
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

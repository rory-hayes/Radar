import { readFile } from "node:fs/promises";

const requiredFiles = [
  "docs/DEMO_DATA_POLICY.md",
  "src/lib/demo-data-policy.ts",
  "supabase/seed.sql",
  "supabase/seeds/README.md",
  "supabase/seeds/radar-demo-workspace.sql",
];

const requiredStrings = {
  "docs/DEMO_DATA_POLICY.md": [
    "local",
    "test",
    "preview",
    "staging",
    "production",
    "workspace_id",
    "pnpm db:reset",
    "must not import seed files",
  ],
  "src/lib/demo-data-policy.ts": [
    "demoDataAllowedEnvironments",
    "demoDataProhibitedEnvironments",
    "seedEntrypoint",
    "firstDemoWorkspaceSeed",
    "workspace_id",
    "phaseOneSeedTables",
    "productRuntimeImportsAllowed: false",
    "realCustomerDataAllowed: false",
  ],
  "supabase/seed.sql": [
    "RADAR_LOCAL_SEED_CONTRACT",
    "supabase/seeds",
    "radar-demo-workspace.sql",
    "workspace_id",
    "production data must never be added here",
  ],
  "supabase/seeds/README.md": [
    "deterministic",
    "workspace_id",
    "Never include real customer content",
    "Never import these files into product runtime code",
    "radar-demo-workspace.sql",
  ],
  "supabase/seeds/radar-demo-workspace.sql": [
    "RAD-019 deterministic local/test seed",
    "auth.users",
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
    "radar-demo-workspace",
    "source.created",
    "assertion.created",
    "run.rerun_requested",
    "finding.updated",
    "workspace_id",
  ],
};

const forbiddenSeedPatterns = [
  /sk_(live|test)_[A-Za-z0-9]/,
  /whsec_[A-Za-z0-9]/,
  /service_role/i,
  /BEGIN\s+PRIVATE\s+KEY/,
  /\bhttps?:\/\//i,
];

const failures = [];

for (const filePath of requiredFiles) {
  let contents = "";

  try {
    contents = await readFile(filePath, "utf8");
  } catch {
    failures.push(`${filePath}: missing required seed policy file`);
    continue;
  }

  for (const requiredString of requiredStrings[filePath]) {
    if (!contents.includes(requiredString)) {
      failures.push(`${filePath}: missing "${requiredString}"`);
    }
  }

  for (const pattern of forbiddenSeedPatterns) {
    if (pattern.test(contents)) {
      failures.push(`${filePath}: contains a forbidden secret-like pattern`);
    }
  }
}

if (failures.length > 0) {
  console.error("Radar seed policy validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Radar seed policy validation passed.");

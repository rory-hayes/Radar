#!/usr/bin/env node

import { readFile } from "fs/promises";
import path from "path";
import process from "process";
import postgres from "postgres";

const repoRoot = process.cwd();

await loadLocalEnv();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required to seed the workspace.");
  process.exit(1);
}

const workspaceId = process.env.RADAR_DEFAULT_WORKSPACE_ID?.trim() || "radar";
const adminRole = process.env.RADAR_ADMIN_ROLE?.trim() || "admin";
const adminEmails = (process.env.RADAR_AUTH_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const sql = postgres(databaseUrl, {
  max: 1,
  ssl: "require",
});

try {
  await sql`
    insert into public.radar_workspaces(id, name)
    values (${workspaceId}, 'Radar')
    on conflict (id) do update set updated_at = now()
  `;

  for (const email of adminEmails) {
    await sql`
      insert into public.radar_workspace_members(
        workspace_id,
        email,
        role,
        status,
        onboarding_state,
        accepted_at
      )
      values (
        ${workspaceId},
        ${email},
        ${adminRole},
        'active',
        'complete',
        now()
      )
      on conflict (workspace_id, email)
      do update set
        role = excluded.role,
        status = 'active',
        onboarding_state = 'complete',
        accepted_at = coalesce(public.radar_workspace_members.accepted_at, now()),
        updated_at = now()
    `;
  }

  console.log(`seeded workspace ${workspaceId} with ${adminEmails.length} admin member(s)`);
} finally {
  await sql.end();
}

async function loadLocalEnv() {
  const envPath = path.join(repoRoot, ".env.local");
  let contents;

  try {
    contents = await readFile(envPath, "utf8");
  } catch {
    return;
  }

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex);
    const value = normalizeEnvValue(trimmed.slice(equalsIndex + 1));
    if (value && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

function normalizeEnvValue(value) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "\"\"" || trimmed === "''") {
    return undefined;
  }
  return trimmed;
}

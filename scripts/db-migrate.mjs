#!/usr/bin/env node

import { readFile, readdir } from "fs/promises";
import path from "path";
import process from "process";
import postgres from "postgres";

const repoRoot = process.cwd();

await loadLocalEnv();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required to run migrations.");
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  max: 1,
  ssl: "require",
});

try {
  await sql`
    create table if not exists public.radar_schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    )
  `;

  const migrationsDir = path.join(repoRoot, "supabase", "migrations");
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const version = file.replace(/\.sql$/, "");
    const existing = await sql`
      select version from public.radar_schema_migrations where version = ${version}
    `;

    if (existing.length > 0) {
      console.log(`skip ${file}`);
      continue;
    }

    const contents = await readFile(path.join(migrationsDir, file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(contents);
      await tx`
        insert into public.radar_schema_migrations(version) values (${version})
      `;
    });
    console.log(`apply ${file}`);
  }
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
    const value = trimmed.slice(equalsIndex + 1);
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

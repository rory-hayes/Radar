#!/usr/bin/env node

import { readFile } from "fs/promises";
import path from "path";
import process from "process";

const repoRoot = process.cwd();

await loadLocalEnv();

const accessToken = readEnv(process.env.SUPABASE_ACCESS_TOKEN);
const projectRef =
  readEnv(process.env.SUPABASE_PROJECT_REF) ??
  projectRefFromUrl(readEnv(process.env.SUPABASE_URL) ?? readEnv(process.env.NEXT_PUBLIC_SUPABASE_URL));

if (!accessToken || !projectRef) {
  const missing = [
    accessToken ? null : "SUPABASE_ACCESS_TOKEN",
    projectRef ? null : "SUPABASE_PROJECT_REF or SUPABASE_URL",
  ].filter(Boolean);
  console.log(`Supabase auth email config skipped: missing ${missing.join(", ")}.`);
  process.exit(0);
}

const inviteTemplate = await readFile(path.join(repoRoot, "supabase", "templates", "invite.html"), "utf8");
const recoveryTemplate = await readFile(path.join(repoRoot, "supabase", "templates", "recovery.html"), "utf8");
const confirmationTemplate = await readFile(
  path.join(repoRoot, "supabase", "templates", "confirmation.html"),
  "utf8",
);
const siteUrl =
  readEnv(process.env.RADAR_APP_URL) ??
  readEnv(process.env.NEXT_PUBLIC_APP_URL) ??
  readEnv(process.env.AUTH_URL) ??
  "https://radar-eight-nu.vercel.app";
const normalizedSiteUrl = siteUrl.replace(/\/+$/, "");
const payload = {
  site_url: normalizedSiteUrl,
  mailer_subjects_invite: "Join your Radar workspace",
  mailer_templates_invite_content: inviteTemplate,
  mailer_subjects_recovery: "Reset your Radar password",
  mailer_templates_recovery_content: recoveryTemplate,
  mailer_subjects_confirmation: "Confirm your Radar account",
  mailer_templates_confirmation_content: confirmationTemplate,
  uri_allow_list: [
    normalizedSiteUrl,
    `${normalizedSiteUrl}/auth/sign-in`,
    `${normalizedSiteUrl}/auth/sign-in?from=recovery`,
    `${normalizedSiteUrl}/auth/accept-invite`,
  ].join(","),
  ...smtpPayload(),
};

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const result = await response.json().catch(() => null);

if (!response.ok) {
  console.error(`Supabase auth email config failed with ${response.status}.`);
  if (result?.message) {
    console.error(result.message);
  }
  process.exit(1);
}

console.log(`Supabase auth email templates configured for ${projectRef}.`);

function smtpPayload() {
  const host = readEnv(process.env.SUPABASE_AUTH_SMTP_HOST);
  const port = readEnv(process.env.SUPABASE_AUTH_SMTP_PORT);
  const user = readEnv(process.env.SUPABASE_AUTH_SMTP_USER);
  const pass = readEnv(process.env.SUPABASE_AUTH_SMTP_PASS);
  const adminEmail = readEnv(process.env.SUPABASE_AUTH_SMTP_ADMIN_EMAIL);
  const senderName = readEnv(process.env.SUPABASE_AUTH_SMTP_SENDER_NAME) ?? "Radar";

  if (!host || !port || !user || !pass || !adminEmail) {
    return {};
  }

  return {
    external_email_enabled: true,
    smtp_host: host,
    smtp_port: port,
    smtp_user: user,
    smtp_pass: pass,
    smtp_admin_email: adminEmail,
    smtp_sender_name: senderName,
  };
}

function projectRefFromUrl(value) {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value).hostname.split(".")[0];
  } catch {
    return undefined;
  }
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

  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    const unquoted = trimmed.slice(1, -1).trim();
    return unquoted || undefined;
  }

  return trimmed;
}

function readEnv(value) {
  return normalizeEnvValue(value ?? "");
}

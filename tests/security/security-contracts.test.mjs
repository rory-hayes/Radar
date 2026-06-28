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

test("local password auth still compares the submitted password", () => {
  const session = read("src/lib/auth/session.ts");

  assert.match(session, /LOCAL_AUTH_PASSWORD/);
  assert.match(session, /mode:\s+"local"[\s\S]*password:\s+password\s+\|\|\s+LOCAL_AUTH_PASSWORD/);
  assert.match(
    session,
    /\(runtime\.mode === "password" \|\| runtime\.mode === "local"\)[\s\S]*!safeEqual\(input\.password,\s*runtime\.password \?\? ""\)/,
  );
});

test("session API parser lets optional body schemas use defaults", () => {
  const http = read("src/lib/sessions/http.ts");

  assert.match(http, /request\.text\(\)/);
  assert.match(http, /if \(rawBody\.trim\(\)\)/);
  assert.match(http, /let body: unknown = \{\}/);
});

test("V1 API CORS and auth boundaries stay explicit", () => {
  const http = read("src/lib/sessions/http.ts");
  const background = read("apps/extension/src/background.js");
  const v1Routes = [
    "src/app/api/v1/sessions/route.ts",
    "src/app/api/v1/sessions/preflight/route.ts",
    "src/app/api/v1/sessions/[id]/client-secrets/route.ts",
    "src/app/api/v1/sessions/[id]/segments/route.ts",
    "src/app/api/v1/sessions/[id]/events/route.ts",
    "src/app/api/v1/sessions/[id]/end/route.ts",
    "src/app/api/v1/cards/[id]/feedback/route.ts",
  ];
  const ownedSessionRoutes = v1Routes.filter((route) => route !== "src/app/api/v1/sessions/route.ts" && !route.endsWith("/preflight/route.ts"));

  assert.doesNotMatch(http, /Access-Control-Allow-Origin["']:\s*process\.env\.RADAR_EXTENSION_ORIGIN\?\.trim\(\)\s*\|\|\s*["']\*["']/);
  assert.match(http, /RADAR_EXTENSION_ORIGIN/);
  assert.match(http, /Access-Control-Allow-Credentials/);
  assert.match(http, /assertAllowedOrigin\(request\)/);
  assert.match(http, /function normalizeAllowedOrigin/);
  assert.match(http, /parsed\.protocol === "http:" \|\| parsed\.protocol === "https:"/);
  assert.match(http, /trimmed\.replace\(\/\\\/\+\$\/,\s*""\)/);

  for (const route of v1Routes) {
    assert.match(read(route), /requireApiAuth/);
  }

  for (const route of ownedSessionRoutes) {
    assert.match(read(route), /assertSessionAccess/);
  }

  assert.match(read("src/app/api/v1/sessions/route.ts"), /createdByEmail:\s*auth\.email/);
  assert.match(background, /credentials:\s*"include"/);
});

test("sign-in and realtime credential requests are rate limited", () => {
  const signInRoute = read("src/app/api/auth/sign-in/route.ts");
  const clientSecretRoute = read("src/app/api/v1/sessions/[id]/client-secrets/route.ts");
  const rateLimit = read("src/lib/security/rate-limit.ts");

  assert.match(rateLimit, /consumeRateLimit/);
  assert.match(rateLimit, /__radarRateLimitStore/);
  assert.match(signInRoute, /auth:sign-in/);
  assert.match(signInRoute, /status:\s*429/);
  assert.match(clientSecretRoute, /v1:realtime:client-secret/);
  assert.match(clientSecretRoute, /Too many Realtime credential requests/);
});

test("extension end keeps a saved-call review path visible", () => {
  const background = read("apps/extension/src/background.js");
  const popupHtml = read("apps/extension/src/popup.html");
  const popupJs = read("apps/extension/src/popup.js");
  const popupCss = read("apps/extension/src/popup.css");

  assert.match(background, /lastEndedSession/);
  assert.match(background, /reviewUrl:\s*`\$\{radarState\.apiBase\}\/app\/sessions\/\$\{encodeURIComponent\(endedSession\.id\)\}`/);
  assert.doesNotMatch(background, /\/end`,\s*\{\s*reason\s*\}\)\.catch\(\(\)\s*=>\s*undefined\)/);
  assert.match(popupHtml, /id="reviewCallLink"/);
  assert.match(popupJs, /function renderReviewLink/);
  assert.match(popupJs, /appUrl\(state,\s*"\/app\/sessions"\)/);
  assert.match(popupJs, /Open Radar Calls/);
  assert.match(popupJs, /Call saved\. It now appears in Radar Calls and analytics\./);
  assert.match(popupCss, /\.review-link\[hidden\]/);
});

test("extension keeps operator-selected API base and renders error state", () => {
  const background = read("apps/extension/src/background.js");
  const popupJs = read("apps/extension/src/popup.js");

  assert.doesNotMatch(background, /LEGACY_LOCAL_API_BASE/);
  assert.doesNotMatch(background, /apiBase\s*===\s*["']http:\/\/localhost:3000["'][\s\S]*DEFAULT_API_BASE/);
  assert.match(popupJs, /error\.state/);
  assert.match(popupJs, /nextState\s*=\s*error\.state/);
});

test("extension package download stays authenticated and excludes secrets", () => {
  const route = read("src/app/api/extension/package/route.ts");
  const packageBuilder = read("src/lib/extension/package.ts");
  const nextConfig = read("next.config.ts");
  const onboarding = read("src/components/admin/onboarding-tour.tsx");
  const overview = read("src/components/admin/overview-page.tsx");
  const expectedFiles = [
    "manifest.json",
    "README.md",
    "src/background.js",
    "src/content.css",
    "src/content.js",
    "src/offscreen.html",
    "src/offscreen.js",
    "src/popup.css",
    "src/popup.html",
    "src/popup.js",
  ];

  assert.match(route, /requireApiAuth/);
  assert.match(route, /Content-Disposition/);
  assert.match(route, /application\/zip/);
  assert.match(packageBuilder, /import "server-only";/);
  assert.match(nextConfig, /outputFileTracingIncludes/);
  assert.match(nextConfig, /\/api\/extension\/package/);
  assert.match(nextConfig, /\.\/apps\/extension\/\*\*\/\*/);

  for (const file of expectedFiles) {
    assert.match(packageBuilder, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.doesNotMatch(packageBuilder, /\.env/);
  assert.doesNotMatch(packageBuilder, /OPENAI_API_KEY/);
  assert.match(onboarding, /\/api\/extension\/package/);
  assert.match(overview, /\/api\/extension\/package/);
});

test("escaped Supabase invite and recovery hashes are rescued consistently", () => {
  const helper = read("src/lib/auth/supabase-hash.ts");
  const home = read("src/app/(routes)/(landing)/(home)/page.tsx");
  const acceptInvite = read("src/components/auth/accept-invite-client.tsx");
  const signIn = read("src/components/auth/sign-in-form.tsx");

  assert.match(helper, /replaceAll\("&amp;",\s*"&"\)/);
  assert.match(helper, /replaceAll\("&#38;",\s*"&"\)/);
  assert.match(helper, /type=invite/);
  assert.match(helper, /type=recovery/);
  assert.match(home, /getSupabaseAuthHashParams\(hash\)/);
  assert.match(home, /inferSupabaseAuthType\(hash\)/);
  assert.match(acceptInvite, /getSupabaseAuthHashParams\(window\.location\.hash\)/);
  assert.match(signIn, /getSupabaseAuthHashParams\(window\.location\.hash\)/);
});

test("auth email configuration can enable a Radar SMTP sender", () => {
  const script = read("scripts/configure-supabase-auth-email.mjs");

  assert.match(script, /confirmation\.html/);
  assert.match(script, /mailer_subjects_confirmation/);
  assert.match(script, /mailer_templates_confirmation_content/);
  assert.match(script, /external_email_enabled:\s*true/);
  assert.match(script, /smtp_sender_name:\s*senderName/);
  assert.match(script, /trimmed\.startsWith\("\\""\)/);
  assert.match(script, /trimmed\.startsWith\("'"\)/);
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

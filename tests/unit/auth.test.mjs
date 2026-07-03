import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function fileExists(relativePath) {
  await access(relativePath);
  return true;
}

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-011 installs Supabase SSR auth dependencies", async () => {
  const packageJson = JSON.parse(await readWorkspaceFile("package.json"));

  assert.ok(packageJson.dependencies["@supabase/ssr"], "@supabase/ssr should be installed");
  assert.ok(packageJson.dependencies["@supabase/supabase-js"], "@supabase/supabase-js should be installed");
});

test("RAD-011 defines server, browser, proxy, and redirect auth helpers", async () => {
  for (const helperPath of [
    "src/lib/supabase/config.ts",
    "src/lib/supabase/browser.ts",
    "src/lib/supabase/server.ts",
    "src/lib/supabase/proxy.ts",
    "src/lib/auth/session.ts",
    "src/lib/auth/redirects.ts",
    "src/proxy.ts",
  ]) {
    await fileExists(helperPath);
  }

  const serverClient = await readWorkspaceFile("src/lib/supabase/server.ts");
  const proxy = await readWorkspaceFile("src/lib/supabase/proxy.ts");
  const session = await readWorkspaceFile("src/lib/auth/session.ts");
  const redirects = await readWorkspaceFile("src/lib/auth/redirects.ts");

  assert.match(serverClient, /createServerClient/);
  assert.match(serverClient, /cookies\(\)/);
  assert.match(proxy, /supabase\.auth\.getClaims\(\)/);
  assert.match(proxy, /redirectToSignIn/);
  assert.match(session, /requireAuthenticatedUser/);
  assert.match(session, /supabase\.auth\.getClaims\(\)/);
  assert.match(redirects, /startsWith\("\/\/"\)/);
  assert.match(redirects, /includes\(":\/\/"\)/);
});

test("RAD-011 adds public auth routes and guarded app shell sign-out", async () => {
  for (const routePath of [
    "src/app/(auth)/layout.tsx",
    "src/app/(auth)/loading.tsx",
    "src/app/(auth)/sign-in/page.tsx",
    "src/app/(auth)/sign-up/page.tsx",
    "src/app/auth/callback/route.ts",
    "src/app/auth/sign-out/route.ts",
  ]) {
    await fileExists(routePath);
  }

  const authForm = await readWorkspaceFile("src/components/auth/auth-form.tsx");
  const browserClient = await readWorkspaceFile("src/lib/supabase/browser.ts");
  const appLayout = await readWorkspaceFile("src/app/(app)/layout.tsx");
  const topBar = await readWorkspaceFile("src/components/app-shell/top-bar.tsx");
  const callback = await readWorkspaceFile("src/app/auth/callback/route.ts");
  const signOutRoute = await readWorkspaceFile("src/app/auth/sign-out/route.ts");

  assert.match(authForm, /signInWithPassword/);
  assert.match(authForm, /supabase\.auth\.signUp/);
  assert.match(authForm, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(authForm, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(browserClient, /process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(browserClient, /process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(browserClient, /process\.env\.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(authForm, /FieldGroup/);
  assert.doesNotMatch(authForm, /test@example\.com|password123|demo credentials/i);
  assert.match(appLayout, /requireAuthenticatedUser/);
  assert.match(topBar, /\/auth\/sign-out/);
  assert.match(topBar, /Sign out/);
  assert.match(callback, /auth\.signed_in/);
  assert.match(signOutRoute, /auth\.signed_out/);
});

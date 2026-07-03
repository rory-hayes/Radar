import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-020 gate protects app routes and preserves auth redirects", async () => {
  const redirects = await readWorkspaceFile("src/lib/auth/redirects.ts");
  const proxy = await readWorkspaceFile("src/lib/supabase/proxy.ts");
  const appLayout = await readWorkspaceFile("src/app/(app)/layout.tsx");
  const workspaceLayout = await readWorkspaceFile("src/app/(workspace)/layout.tsx");

  assert.match(redirects, /defaultAuthenticatedPath = "\/command-center"/);
  assert.match(redirects, /protectedAppPaths = \[\.\.\.appRoutes\.map\(\(route\) => route\.href\), "\/workspace"\]/);
  assert.match(redirects, /startsWith\("\/\/"\)/);
  assert.match(redirects, /includes\(":\/\/"\)/);
  assert.match(proxy, /isProtectedAppPath\(pathname\)/);
  assert.match(proxy, /redirectToSignIn\(request\)/);
  assert.match(proxy, /redirectUrl\.searchParams\.set\("next"/);
  assert.match(appLayout, /requireAuthenticatedUser\(\)/);
  assert.match(appLayout, /requireActiveWorkspace\(\)/);
  assert.match(workspaceLayout, /requireAuthenticatedUser\(\)/);
});

test("RAD-020 gate verifies workspace isolation and RBAC mutation boundaries", async () => {
  const workspaceServer = await readWorkspaceFile("src/lib/workspaces/server.ts");
  const workspaceRepository = await readWorkspaceFile("src/lib/repositories/workspaces.ts");
  const workspaceGuards = await readWorkspaceFile("src/lib/workspaces/guards.ts");
  const permissions = await readWorkspaceFile("src/lib/workspaces/permissions.ts");
  const settingsAction = await readWorkspaceFile("src/app/(app)/settings/actions.ts");
  const settingsPage = await readWorkspaceFile("src/app/(app)/settings/page.tsx");
  const guardrails = await readWorkspaceFile("src/lib/server/guardrails.ts");

  assert.match(workspaceServer, /getFirstActiveWorkspaceMembershipForUser\(supabase, user\.id\)/);
  assert.match(workspaceRepository, /\.from\("workspace_members"\)/);
  assert.match(workspaceRepository, /\.eq\("user_id", userId\)/);
  assert.match(workspaceRepository, /\.eq\("status", "active"\)/);
  assert.match(workspaceServer, /redirect\("\/workspace\/new"\)/);
  assert.match(workspaceGuards, /requireWorkspacePermission/);
  assert.match(workspaceGuards, /membershipCan\(membership, permission\)/);
  assert.match(permissions, /admin: workspacePermissions/);
  assert.match(permissions, /editor: \[[\s\S]*?"assertion:create"[\s\S]*?"finding:resolve"/);
  assert.match(permissions, /viewer: \["workspace:read"\]/);
  assert.match(settingsAction, /runWorkspaceServerAction/);
  assert.match(settingsAction, /permission: "workspace:manage"/);
  assert.match(settingsPage, /membershipCan\(membership, "workspace:manage"\)/);
  assert.match(guardrails, /getActiveWorkspaceForCurrentUser\(\)/);
  assert.match(guardrails, /membershipCan\(membership, permission\)/);
});

test("RAD-020 gate verifies RLS policies and seeded tenant records are workspace scoped", async () => {
  const workspaceMigration = await readWorkspaceFile("supabase/migrations/20260703090000_create_workspaces_and_memberships.sql");
  const settingsMigration = await readWorkspaceFile("supabase/migrations/20260703093000_add_workspace_settings_fields.sql");
  const auditMigration = await readWorkspaceFile("supabase/migrations/20260703100000_create_audit_logs.sql");
  const hardenedRlsMigration = await readWorkspaceFile("supabase/migrations/20260703111500_harden_workspace_rls_policies.sql");
  const seed = await readWorkspaceFile("supabase/seeds/radar-demo-workspace.sql");

  assert.match(workspaceMigration, /alter table public\.workspaces enable row level security/);
  assert.match(workspaceMigration, /alter table public\.workspace_members enable row level security/);
  assert.match(workspaceMigration, /workspace members can read their workspaces/);
  assert.match(workspaceMigration, /workspace_members\.workspace_id/);
  assert.match(settingsMigration, /workspace admins can update workspace profile/);
  assert.match(settingsMigration, /membership\.role = 'admin'/);
  assert.match(auditMigration, /alter table public\.audit_logs enable row level security/);
  assert.match(auditMigration, /workspace members can read workspace audit logs/);
  assert.match(auditMigration, /authenticated users can write scoped audit logs/);
  assert.match(hardenedRlsMigration, /current_user_is_workspace_member/);
  assert.match(hardenedRlsMigration, /alter table public\.sources force row level security/);
  assert.match(hardenedRlsMigration, /workspace members can read evidence artifacts/);
  assert.match(seed, /insert into public\.workspace_members/);
  assert.match(seed, /insert into public\.audit_logs/);
  assert.match(seed, /'20000000-0000-4000-8000-000000000001'/);
  assert.match(seed, /'admin'/);
  assert.match(seed, /'editor'/);
  assert.match(seed, /'viewer'/);
});

test("RAD-020 gate keeps product scope and primary navigation locked", async () => {
  const routes = await readWorkspaceFile("src/lib/radar-routes.ts");
  const sidebar = await readWorkspaceFile("src/components/app-shell/sidebar-nav.tsx");
  const commandCenter = await readWorkspaceFile("src/app/(app)/command-center/page.tsx");
  const assertions = await readWorkspaceFile("src/app/(app)/assertions/page.tsx");
  const findings = await readWorkspaceFile("src/app/(app)/findings/page.tsx");
  const sources = await readWorkspaceFile("src/app/(app)/sources/page.tsx");

  assert.match(routes, /title: "Command Center"/);
  assert.match(routes, /title: "Assertions"/);
  assert.match(routes, /title: "Findings"/);
  assert.match(routes, /title: "Sources"/);
  assert.match(routes, /hiddenFromPrimaryNav: true/);
  assert.match(sidebar, /primaryAppRoutes\.map/);
  assert.doesNotMatch(sidebar, /Prompt Playground|Trace Explorer|Workflow Canvas|Marketplace/i);

  assert.doesNotMatch(commandCenter, /generic eval|prompt playground|trace explorer|workflow canvas|integration marketplace/i);
  assert.doesNotMatch(commandCenter, /RoutePlaceholder/);
  assert.match(commandCenter, /CommandCenterKpiSummary/);
  assert.match(commandCenter, /listEvaluationRunSummariesForWorkspace/);

  assert.doesNotMatch(assertions, /generic eval|prompt playground|trace explorer|workflow canvas|integration marketplace/i);
  assert.doesNotMatch(assertions, /RoutePlaceholder/);
  assert.match(assertions, /listAssertions/);
  assert.match(assertions, /AssertionTable/);

  assert.doesNotMatch(findings, /generic eval|prompt playground|trace explorer|workflow canvas|integration marketplace/i);
  assert.doesNotMatch(findings, /RoutePlaceholder/);
  assert.match(findings, /listFindings/);
  assert.match(findings, /FindingInbox/);

  assert.doesNotMatch(sources, /generic eval|prompt playground|trace explorer|workflow canvas|integration marketplace/i);
  assert.doesNotMatch(sources, /RoutePlaceholder/);
  assert.match(sources, /listSources/);
  assert.match(sources, /SourceList/);
});

import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function fileExists(relativePath) {
  await access(relativePath);
  return true;
}

test("RAD-007 creates public and app route groups with shell-wrapped app routes", async () => {
  await fileExists("src/app/(public)/layout.tsx");
  await fileExists("src/app/(public)/page.tsx");
  await fileExists("src/app/(app)/layout.tsx");
  await fileExists("src/app/(app)/loading.tsx");
  await fileExists("src/app/(app)/error.tsx");

  for (const route of ["command-center", "assertions", "findings", "sources", "settings"]) {
    await fileExists(`src/app/(app)/${route}/page.tsx`);
  }

  const appLayout = await readFile("src/app/(app)/layout.tsx", "utf8");
  assert.match(appLayout, /<AppShell>\{children\}<\/AppShell>/);
});

test("RAD-007 keeps primary navigation locked to the four V1 pages", async () => {
  const routes = await readFile("src/lib/radar-routes.ts", "utf8");
  const sidebarNav = await readFile("src/components/app-shell/sidebar-nav.tsx", "utf8");
  const primaryRoutes = routes.match(/export const primaryAppRoutes = \[([\s\S]*?)\] as const;/)?.[1];

  assert.ok(primaryRoutes, "primaryAppRoutes should be declared");

  for (const [title, href] of [
    ["Command Center", "/command-center"],
    ["Assertions", "/assertions"],
    ["Findings", "/findings"],
    ["Sources", "/sources"],
  ]) {
    assert.match(primaryRoutes, new RegExp(`title: "${title}"`));
    assert.match(primaryRoutes, new RegExp(`href: "${href}"`));
  }

  assert.doesNotMatch(primaryRoutes, /Settings/);
  assert.match(routes, /hiddenFromPrimaryNav: true/);
  assert.match(sidebarNav, /primaryAppRoutes\.map/);
  assert.doesNotMatch(sidebarNav, /\/settings/);
});

test("RAD-007 exposes stable shell component boundaries", async () => {
  const barrel = await readFile("src/components/app-shell/index.ts", "utf8");
  const appShell = await readFile("src/components/app-shell/app-shell.tsx", "utf8");

  for (const exportName of ["AppShell", "SidebarNav", "TopBar", "PageHeader"]) {
    assert.match(barrel, new RegExp(`export \\{ ${exportName} \\}`));
  }

  assert.match(appShell, /<SidebarProvider>/);
  assert.match(appShell, /<SidebarNav \/>/);
  assert.match(appShell, /<TopBar \/>/);
});

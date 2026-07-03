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

test("RAD-018 exposes reusable Radar loading, empty, error, and not-found states", async () => {
  for (const path of [
    "src/components/radar/loading-state.tsx",
    "src/components/radar/empty-state.tsx",
    "src/components/radar/error-state.tsx",
    "src/components/radar/not-found-state.tsx",
  ]) {
    await fileExists(path);
  }

  const loadingState = await readWorkspaceFile("src/components/radar/loading-state.tsx");
  const emptyState = await readWorkspaceFile("src/components/radar/empty-state.tsx");
  const errorState = await readWorkspaceFile("src/components/radar/error-state.tsx");
  const notFoundState = await readWorkspaceFile("src/components/radar/not-found-state.tsx");
  const barrel = await readWorkspaceFile("src/components/radar/index.ts");

  assert.match(loadingState, /Skeleton/);
  assert.match(loadingState, /variant\?: "cards" \| "list" \| "form"/);
  assert.match(loadingState, /aria-busy="true"/);
  assert.match(emptyState, /CardHeader/);
  assert.match(emptyState, /CardTitle/);
  assert.match(emptyState, /CardDescription/);
  assert.match(emptyState, /CardFooter/);
  assert.match(errorState, /Alert variant="destructive"/);
  assert.match(errorState, /CircleAlertIcon/);
  assert.match(notFoundState, /Button asChild variant="outline"/);
  assert.match(notFoundState, /ArrowLeftIcon data-icon="inline-start"/);
  assert.match(barrel, /NotFoundState/);
});

test("RAD-018 wires route loading, error, retry, and not-found boundaries", async () => {
  for (const path of [
    "src/app/loading.tsx",
    "src/app/error.tsx",
    "src/app/not-found.tsx",
    "src/app/(app)/loading.tsx",
    "src/app/(app)/error.tsx",
    "src/app/(app)/not-found.tsx",
    "src/app/(auth)/loading.tsx",
    "src/app/(auth)/error.tsx",
    "src/app/(workspace)/loading.tsx",
    "src/app/(workspace)/error.tsx",
  ]) {
    await fileExists(path);
  }

  const rootLoading = await readWorkspaceFile("src/app/loading.tsx");
  const rootError = await readWorkspaceFile("src/app/error.tsx");
  const rootNotFound = await readWorkspaceFile("src/app/not-found.tsx");
  const appNotFound = await readWorkspaceFile("src/app/(app)/not-found.tsx");
  const authError = await readWorkspaceFile("src/app/(auth)/error.tsx");
  const workspaceError = await readWorkspaceFile("src/app/(workspace)/error.tsx");

  assert.match(rootLoading, /LoadingState/);
  assert.match(rootError, /ErrorState/);
  assert.match(rootError, /reset/);
  assert.match(rootNotFound, /NotFoundState/);
  assert.match(rootNotFound, /Page not found/);
  assert.match(appNotFound, /Return to Command Center/);
  assert.match(authError, /Authentication could not load/);
  assert.match(workspaceError, /Workspace setup could not load/);
});

test("RAD-018 gives every primary placeholder a Radar-specific empty state", async () => {
  const routePlaceholder = await readWorkspaceFile("src/components/app-shell/route-placeholder.tsx");

  assert.match(routePlaceholder, /EmptyState/);
  assert.match(routePlaceholder, /emptyState/);

  for (const [route, expectedCopy] of [
    ["command-center", "No verification activity yet"],
    ["assertions", "No assertions are being verified yet"],
    ["findings", "No evidence-backed findings yet"],
  ]) {
    const page = await readWorkspaceFile(`src/app/(app)/${route}/page.tsx`);

    assert.match(page, new RegExp(expectedCopy));
    assert.match(page, /details:/);
    assert.doesNotMatch(page, /prompt playground|trace explorer|workflow canvas|integration marketplace/i);
  }

  const sourcesPage = await readWorkspaceFile("src/app/(app)/sources/page.tsx");

  assert.match(sourcesPage, /No sources are connected yet/);
  assert.match(sourcesPage, /Source type/);
  assert.match(sourcesPage, /Sync health/);
  assert.match(sourcesPage, /Affected assertions/);
  assert.doesNotMatch(sourcesPage, /prompt playground|trace explorer|workflow canvas|integration marketplace/i);
});

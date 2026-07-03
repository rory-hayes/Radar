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

test("RAD-043 adds an assertion detail route with loading and not-found handling", async () => {
  await fileExists("src/app/(app)/assertions/[assertionId]/page.tsx");
  await fileExists("src/app/(app)/assertions/[assertionId]/loading.tsx");
  await fileExists("src/components/assertions/assertion-detail.tsx");

  const page = await readWorkspaceFile("src/app/(app)/assertions/[assertionId]/page.tsx");
  const loading = await readWorkspaceFile("src/app/(app)/assertions/[assertionId]/loading.tsx");

  assert.match(page, /AssertionDetailPage/);
  assert.match(page, /requireActiveWorkspace/);
  assert.match(page, /createSupabaseServerClient/);
  assert.match(page, /notFound\(\)/);
  assert.match(page, /ErrorState/);
  assert.match(loading, /LoadingState/);
  assert.match(loading, /Loading assertion detail/);
});

test("RAD-043 detail loads summary linked sources test cases run history and findings", async () => {
  const page = await readWorkspaceFile("src/app/(app)/assertions/[assertionId]/page.tsx");
  const detail = await readWorkspaceFile("src/components/assertions/assertion-detail.tsx");
  const assertionRepository = await readWorkspaceFile("src/lib/repositories/assertions.ts");
  const evaluationRepository = await readWorkspaceFile("src/lib/repositories/evaluation.ts");
  const findingsRepository = await readWorkspaceFile("src/lib/repositories/findings.ts");

  assert.match(page, /getAssertionById/);
  assert.match(page, /listAssertionSourcesForAssertion/);
  assert.match(page, /listSources/);
  assert.match(page, /listTestCasesForAssertion/);
  assert.match(page, /listEvaluationRunSummariesForAssertion/);
  assert.match(page, /listFindingsForAssertion/);
  assert.match(detail, /AssertionOverview/);
  assert.match(detail, /AssertionSources/);
  assert.match(detail, /AssertionTestCases/);
  assert.match(detail, /AssertionRunHistory/);
  assert.match(detail, /AssertionFindings/);
  assert.match(assertionRepository, /export async function listTestCasesForAssertion/);
  assert.match(evaluationRepository, /export async function listEvaluationRunSummariesForAssertion/);
  assert.match(findingsRepository, /export async function listFindingsForAssertion/);
});

test("RAD-043 exposes assertion actions and inventory drill-down without new primary scope", async () => {
  const page = await readWorkspaceFile("src/app/(app)/assertions/[assertionId]/page.tsx");
  const table = await readWorkspaceFile("src/components/assertions/assertion-table.tsx");
  const detail = await readWorkspaceFile("src/components/assertions/assertion-detail.tsx");

  assert.match(page, /membershipCan\(membership, "assertion:edit"\)/);
  assert.match(page, /href=\{`\/assertions\/\$\{assertion\.id\}\/edit`\}/);
  assert.match(page, /href="\/assertions"/);
  assert.match(table, /href=\{`\/assertions\/\$\{assertion\.id\}`\}/);
  assert.match(detail, /TabsTrigger value="overview"/);
  assert.match(detail, /TabsTrigger value="sources"/);
  assert.match(detail, /TabsTrigger value="test-cases"/);
  assert.match(detail, /TabsTrigger value="runs"/);
  assert.match(detail, /TabsTrigger value="findings"/);

  for (const source of [page, table, detail]) {
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace/i);
    assert.doesNotMatch(source, /service_role|sb_secret/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});

test("RAD-043 composes approved shadcn primitives and read-only placeholders", async () => {
  const detail = await readWorkspaceFile("src/components/assertions/assertion-detail.tsx");
  const task = await readWorkspaceFile("tasks/phase-4-assertions-testcases/rad-043-build-assertion-detail-page-foundation.md");

  assert.match(detail, /Card/);
  assert.match(detail, /Table/);
  assert.match(detail, /Tabs/);
  assert.match(detail, /TabsList/);
  assert.match(detail, /StatusBadge/);
  assert.match(detail, /SeverityBadge/);
  assert.match(detail, /EmptyState/);
  assert.match(detail, /No test cases configured/);
  assert.match(detail, /No run history yet/);
  assert.match(detail, /No findings linked/);
  assert.match(task, /Assertion detail/);
});

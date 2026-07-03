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

test("RAD-095 creates workspace-scoped abuse limit events with RLS", async () => {
  await fileExists("supabase/migrations/20260703132000_create_abuse_limit_events.sql");

  const migration = await readWorkspaceFile("supabase/migrations/20260703132000_create_abuse_limit_events.sql");
  const repository = await readWorkspaceFile("src/lib/repositories/abuse.ts");
  const index = await readWorkspaceFile("src/lib/repositories/index.ts");

  assert.match(migration, /create type public\.abuse_limit_event_type/);
  assert.match(migration, /'source_sync'/);
  assert.match(migration, /'eval_run'/);
  assert.match(migration, /'ai_call'/);
  assert.match(migration, /'api_request'/);
  assert.match(migration, /'file_upload'/);
  assert.match(migration, /'runner_execution'/);
  assert.match(migration, /workspace_id uuid not null references public\.workspaces\(id\) on delete cascade/);
  assert.match(migration, /user_id uuid references auth\.users\(id\) on delete set null/);
  assert.match(migration, /alter table public\.abuse_limit_events enable row level security/);
  assert.match(migration, /current_user_is_workspace_member\(abuse_limit_events\.workspace_id\)/);
  assert.match(migration, /abuse_limit_events\.user_id is null or abuse_limit_events\.user_id = auth\.uid\(\)/);
  assert.match(repository, /recordAbuseLimitEvent/);
  assert.match(repository, /sumAbuseLimitEvents/);
  assert.match(index, /repositories\/abuse/);
});

test("RAD-095 defines workspace and user limits for expensive operations", async () => {
  const schema = await readWorkspaceFile("src/lib/abuse/schema.ts");
  const limits = await readWorkspaceFile("src/lib/abuse/limits.ts");
  const enforcement = await readWorkspaceFile("src/lib/abuse/enforcement.ts");

  assert.match(schema, /abuseLimitEventTypes/);
  assert.match(limits, /source_sync_workspace_hour/);
  assert.match(limits, /source_sync_user_hour/);
  assert.match(limits, /eval_run_workspace_hour/);
  assert.match(limits, /eval_run_user_hour/);
  assert.match(limits, /ai_call_workspace_hour/);
  assert.match(limits, /ai_call_user_hour/);
  assert.match(limits, /api_request_workspace_minute/);
  assert.match(limits, /api_request_user_minute/);
  assert.match(limits, /file_upload_workspace_hour/);
  assert.match(limits, /runner_execution_workspace_hour/);
  assert.match(limits, /uploadedDocumentMaxBytes/);
  assert.match(limits, /knowledgeTargetTimeoutMs/);
  assert.match(enforcement, /getAbuseLimitDecision/);
  assert.match(enforcement, /checkAndRecordAbuseLimit/);
  assert.match(enforcement, /currentUsage \+ quantity > rule\.limit/);
});

test("RAD-095 wires API requests through guardrail rate limits", async () => {
  const guardrails = await readWorkspaceFile("src/lib/server/guardrails.ts");
  const evidenceRoute = await readWorkspaceFile("src/app/api/evidence/retrieve/route.ts");
  const sourceRoute = await readWorkspaceFile("src/app/api/sources/sync/route.ts");
  const emailRoute = await readWorkspaceFile("src/app/api/notifications/email/route.ts");
  const slackRoute = await readWorkspaceFile("src/app/api/notifications/slack/route.ts");

  assert.match(guardrails, /rate_limited/);
  assert.match(guardrails, /statusForCode/);
  assert.match(guardrails, /rate_limited: 429/);
  assert.match(guardrails, /enforceApiRateLimit/);
  assert.match(guardrails, /checkAndRecordAbuseLimit/);
  for (const route of [evidenceRoute, sourceRoute, emailRoute, slackRoute]) {
    assert.match(route, /rateLimit/);
    assert.match(route, /eventType: "api_request"/);
  }
  assert.match(sourceRoute, /eventType: "source_sync"/);
});

test("RAD-095 protects source syncs uploads AI calls eval runs and runner execution", async () => {
  const sourceActions = await readWorkspaceFile("src/app/(app)/sources/actions.ts");
  const assertionActions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");
  const findingActions = await readWorkspaceFile("src/app/(app)/findings/actions.ts");
  const jobs = await readWorkspaceFile("src/lib/evaluation/job-orchestration.ts");
  const knowledgeRunner = await readWorkspaceFile("src/lib/evaluation/knowledge-runner.ts");
  const security = await readWorkspaceFile("docs/SECURITY.md");

  assert.match(sourceActions, /abusePayloadLimits\.uploadedDocumentMaxBytes/);
  assert.match(sourceActions, /abusePayloadLimits\.manualTextMaxCharacters/);
  assert.match(sourceActions, /eventType: "file_upload"/);
  assert.match(sourceActions, /eventType: "source_sync"/);
  assert.match(assertionActions, /eventType: "ai_call"/);
  assert.match(assertionActions, /eventType: "eval_run"/);
  assert.match(findingActions, /eventType: "eval_run"/);
  assert.match(jobs, /eventType: "runner_execution"/);
  assert.match(knowledgeRunner, /runnerDurationLimits\.knowledgeTargetTimeoutMs/);
  assert.match(knowledgeRunner, /AbortController/);
  assert.match(knowledgeRunner, /knowledgeEndpointResponseMaxCharacters/);
  assert.match(security, /Rate Limits, Quotas, And Abuse Controls/);
  assert.match(security, /HTTP 429/);
});

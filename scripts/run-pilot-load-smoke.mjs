import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";

const pilotProfile = {
  workspaceCount: 1,
  sourceCount: 120,
  assertionsPerSource: 3,
  testCasesPerAssertion: 4,
  evaluationRuns: 900,
  findingRate: 0.18,
  embeddingBatchSize: 100,
  embeddingConcurrency: 4,
  jobConcurrency: 12,
};

const budgetsMs = {
  sourceIngestion: 650,
  embeddingScheduling: 250,
  evaluationScheduling: 350,
  dashboardAggregation: 120,
  total: 1200,
};

async function main() {
  const startedAt = performance.now();
  const ingestion = measure("sourceIngestion", () => buildSourceCorpus(pilotProfile));
  const embedding = await measureAsync("embeddingScheduling", () =>
    simulateEmbeddingScheduling(ingestion.value.chunks, pilotProfile),
  );
  const evaluation = await measureAsync("evaluationScheduling", () =>
    simulateEvaluationScheduling(ingestion.value.assertions, pilotProfile),
  );
  const dashboard = measure("dashboardAggregation", () =>
    buildDashboardSummary({
      sources: ingestion.value.sources,
      assertions: ingestion.value.assertions,
      runs: evaluation.value.runs,
      findings: evaluation.value.findings,
    }),
  );
  const totalMs = performance.now() - startedAt;
  const metrics = {
    profile: pilotProfile,
    budgetsMs,
    measurementsMs: {
      sourceIngestion: round(ingestion.durationMs),
      embeddingScheduling: round(embedding.durationMs),
      evaluationScheduling: round(evaluation.durationMs),
      dashboardAggregation: round(dashboard.durationMs),
      total: round(totalMs),
    },
    throughput: {
      sourceDocuments: ingestion.value.documents.length,
      sourceChunks: ingestion.value.chunks.length,
      embeddingBatches: embedding.value.batchCount,
      evaluationRuns: evaluation.value.runs.length,
      findings: evaluation.value.findings.length,
      dashboardItems: dashboard.value.itemCount,
    },
  };

  assertBudget("sourceIngestion", metrics.measurementsMs.sourceIngestion);
  assertBudget("embeddingScheduling", metrics.measurementsMs.embeddingScheduling);
  assertBudget("evaluationScheduling", metrics.measurementsMs.evaluationScheduling);
  assertBudget("dashboardAggregation", metrics.measurementsMs.dashboardAggregation);
  assertBudget("total", metrics.measurementsMs.total);

  process.stdout.write(`${JSON.stringify(metrics, null, 2)}\n`);
}

function buildSourceCorpus(profile) {
  const sources = Array.from({ length: profile.sourceCount }, (_, index) => ({
    id: `source-${index + 1}`,
    type: index % 5 === 0 ? "uploaded_document" : index % 3 === 0 ? "manual_text" : "url",
    syncStatus: index % 13 === 0 ? "error" : "synced",
    updatedAt: isoMinutesAgo(index),
  }));
  const documents = [];
  const chunks = [];
  const assertions = [];

  for (const source of sources) {
    const body = buildDocumentBody(source.id, 18_000);
    const sourceChunks = chunkText(body, 3_800).map((content, chunkIndex) => ({
      id: `${source.id}-chunk-${chunkIndex + 1}`,
      sourceId: source.id,
      chunkIndex,
      contentHash: sha256(content),
      tokenCount: Math.ceil(content.length / 4),
    }));

    documents.push({
      id: `${source.id}-document-1`,
      sourceId: source.id,
      byteSize: Buffer.byteLength(body),
      contentHash: sha256(body),
    });
    chunks.push(...sourceChunks);

    for (let assertionIndex = 0; assertionIndex < profile.assertionsPerSource; assertionIndex += 1) {
      assertions.push({
        id: `${source.id}-assertion-${assertionIndex + 1}`,
        sourceId: source.id,
        status: assertionIndex % 7 === 0 ? "paused" : "active",
        priority: assertionIndex % 5 === 0 ? "critical" : assertionIndex % 3 === 0 ? "high" : "medium",
        testCaseCount: profile.testCasesPerAssertion,
      });
    }
  }

  return { sources, documents, chunks, assertions };
}

async function simulateEmbeddingScheduling(chunks, profile) {
  const batches = [];

  for (let index = 0; index < chunks.length; index += profile.embeddingBatchSize) {
    batches.push(chunks.slice(index, index + profile.embeddingBatchSize));
  }

  let cursor = 0;
  let processed = 0;
  const workers = Array.from({ length: profile.embeddingConcurrency }, async () => {
    while (cursor < batches.length) {
      const batch = batches[cursor];
      cursor += 1;
      processed += await fakeEmbeddingBatch(batch);
    }
  });

  await Promise.all(workers);

  return {
    batchCount: batches.length,
    processed,
  };
}

async function fakeEmbeddingBatch(batch) {
  await Promise.resolve();
  return batch.reduce((sum, chunk) => sum + Number(chunk.tokenCount > 0), 0);
}

async function simulateEvaluationScheduling(assertions, profile) {
  const queuedRuns = Array.from({ length: profile.evaluationRuns }, (_, index) => {
    const assertion = assertions[index % assertions.length];

    return {
      id: `run-${index + 1}`,
      assertionId: assertion.id,
      runnerType: index % 5 === 0 ? "journey" : index % 3 === 0 ? "integration" : "knowledge",
      priority: assertion.priority,
    };
  });
  const runs = [];
  const findings = [];
  let cursor = 0;
  const workers = Array.from({ length: profile.jobConcurrency }, async () => {
    while (cursor < queuedRuns.length) {
      const run = queuedRuns[cursor];
      cursor += 1;
      const completedRun = await fakeEvaluationRun(run);
      runs.push(completedRun);

      if (completedRun.score < profile.findingRate) {
        findings.push({
          id: `finding-${completedRun.id}`,
          assertionId: completedRun.assertionId,
          severity: completedRun.priority === "critical" ? "critical" : "medium",
          status: "open",
        });
      }
    }
  });

  await Promise.all(workers);

  return { runs, findings };
}

async function fakeEvaluationRun(run) {
  await Promise.resolve();
  const scoreSeed = Number.parseInt(sha256(run.id).slice(0, 4), 16) / 0xffff;

  return {
    ...run,
    status: scoreSeed > 0.2 ? "passed" : "failed",
    score: scoreSeed,
  };
}

function buildDashboardSummary({ sources, assertions, runs, findings }) {
  const activeAssertions = assertions.filter((assertion) => assertion.status === "active");
  const terminalRuns = runs.filter((run) => run.status === "passed" || run.status === "failed");
  const passCount = terminalRuns.filter((run) => run.status === "passed").length;
  const openFindings = findings.filter((finding) => finding.status === "open");
  const sourceErrors = sources.filter((source) => source.syncStatus === "error");

  return {
    itemCount: sources.length + assertions.length + runs.length + findings.length,
    activeAssertionCount: activeAssertions.length,
    passRate: terminalRuns.length ? passCount / terminalRuns.length : 0,
    needsAttentionCount: openFindings.length + sourceErrors.length,
  };
}

function chunkText(content, maxCharacters) {
  const chunks = [];

  for (let index = 0; index < content.length; index += maxCharacters) {
    chunks.push(content.slice(index, index + maxCharacters));
  }

  return chunks;
}

function buildDocumentBody(sourceId, targetLength) {
  const sentence = `${sourceId} refund policy trial onboarding billing escalation verified answer. `;
  let body = "";

  while (body.length < targetLength) {
    body += sentence;
  }

  return body.slice(0, targetLength);
}

function measure(name, callback) {
  const startedAt = performance.now();
  const value = callback();

  return {
    name,
    value,
    durationMs: performance.now() - startedAt,
  };
}

async function measureAsync(name, callback) {
  const startedAt = performance.now();
  const value = await callback();

  return {
    name,
    value,
    durationMs: performance.now() - startedAt,
  };
}

function assertBudget(name, durationMs) {
  if (durationMs > budgetsMs[name]) {
    throw new Error(`${name} exceeded ${budgetsMs[name]}ms budget with ${durationMs}ms.`);
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function isoMinutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function round(value) {
  return Math.round(value * 100) / 100;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});

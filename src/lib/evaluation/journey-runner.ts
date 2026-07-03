import "server-only";

import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

import {
  type RunnerEvidenceArtifact,
  type SharedRunnerContext,
} from "@/lib/evaluation/runner-contract";
import { uploadEvidenceArtifact, type EvidenceStorageClient } from "@/lib/storage";

export const journeyRunnerFoundationVersion = "rad-062";

export type JourneyCredentialInput = {
  name: string;
  value: string;
  redactionLabel?: string;
};

export type JourneyRunnerTimeouts = {
  actionTimeoutMs: number;
  navigationTimeoutMs: number;
  overallTimeoutMs: number;
};

export type JourneyBrowserSessionInput = {
  storageClient: EvidenceStorageClient;
  runnerContext: SharedRunnerContext;
  baseUrl?: string;
  credentials?: readonly JourneyCredentialInput[];
  viewport?: {
    width: number;
    height: number;
  };
  timeouts?: Partial<JourneyRunnerTimeouts>;
  traceLabel?: string;
};

export type JourneyBrowserSession = {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  redact: (value: string) => string;
};

export type JourneyBrowserSessionResult<T> = {
  result: T;
  artifacts: RunnerEvidenceArtifact[];
  durationMs: number;
};

export const defaultJourneyRunnerTimeouts = {
  actionTimeoutMs: 10_000,
  navigationTimeoutMs: 15_000,
  overallTimeoutMs: 60_000,
} satisfies JourneyRunnerTimeouts;

export async function runJourneyBrowserSession<T>(
  input: JourneyBrowserSessionInput,
  execute: (session: JourneyBrowserSession) => Promise<T>,
): Promise<JourneyBrowserSessionResult<T>> {
  const startedAt = Date.now();
  const timeouts = normalizeJourneyTimeouts(input.timeouts);
  const browser = await chromium.launch({ headless: true });
  const tempDir = await mkdtemp(join(tmpdir(), "radar-journey-"));
  const tracePath = join(tempDir, `${input.runnerContext.run.id}-trace.zip`);
  const artifacts: RunnerEvidenceArtifact[] = [];

  let context: BrowserContext | null = null;

  try {
    context = await browser.newContext({
      baseURL: input.baseUrl,
      viewport: input.viewport ?? { width: 1440, height: 1000 },
      ignoreHTTPSErrors: false,
      permissions: [],
      storageState: undefined,
    });
    context.setDefaultTimeout(timeouts.actionTimeoutMs);
    context.setDefaultNavigationTimeout(timeouts.navigationTimeoutMs);
    await context.tracing.start({ screenshots: true, snapshots: true, sources: false });

    const page = await context.newPage();
    const result = await withJourneyTimeout(
      execute({
        browser,
        context,
        page,
        redact: (value) => redactJourneyText(value, input.credentials ?? []),
      }),
      timeouts.overallTimeoutMs,
    );

    artifacts.push(await captureJourneyScreenshot(input, page, "journey-final"));
    artifacts.push(await stopAndUploadJourneyTrace(input, context, tracePath));

    return {
      result,
      artifacts,
      durationMs: Math.max(0, Date.now() - startedAt),
    };
  } catch (error) {
    if (context) {
      try {
        const page = context.pages()[0];

        if (page) {
          artifacts.push(await captureJourneyScreenshot(input, page, "journey-error"));
        }

        artifacts.push(await stopAndUploadJourneyTrace(input, context, tracePath));
      } catch {
        // Capture failures must not mask the runner failure.
      }
    }

    throw new JourneyRunnerFoundationError(journeyErrorMessage(error), artifacts);
  } finally {
    await browser.close();
    await rm(tempDir, { force: true, recursive: true });
  }
}

export function normalizeJourneyTimeouts(input: Partial<JourneyRunnerTimeouts> = {}): JourneyRunnerTimeouts {
  return {
    actionTimeoutMs: boundedTimeout(input.actionTimeoutMs, defaultJourneyRunnerTimeouts.actionTimeoutMs),
    navigationTimeoutMs: boundedTimeout(input.navigationTimeoutMs, defaultJourneyRunnerTimeouts.navigationTimeoutMs),
    overallTimeoutMs: boundedTimeout(input.overallTimeoutMs, defaultJourneyRunnerTimeouts.overallTimeoutMs),
  };
}

export function redactedJourneyCredentialMetadata(credentials: readonly JourneyCredentialInput[] = []) {
  return credentials.map((credential) => ({
    name: credential.name,
    redacted: true,
    label: credential.redactionLabel ?? `${credential.name}:redacted`,
  }));
}

export function redactJourneyText(value: string, credentials: readonly JourneyCredentialInput[] = []) {
  return credentials.reduce((redacted, credential) => {
    if (!credential.value) {
      return redacted;
    }

    return redacted.split(credential.value).join(credential.redactionLabel ?? `[redacted:${credential.name}]`);
  }, value);
}

async function captureJourneyScreenshot(
  input: JourneyBrowserSessionInput,
  page: Page,
  label: string,
): Promise<RunnerEvidenceArtifact> {
  const screenshot = await page.screenshot({ fullPage: true, type: "png" });
  const artifact = await uploadEvidenceArtifact(
    input.storageClient,
    {
      workspaceId: input.runnerContext.workspaceId,
      artifactKind: "screenshot",
      ownerId: input.runnerContext.run.id,
      fileName: artifactFileName(label, "png"),
    },
    new Blob([new Uint8Array(screenshot)], { type: "image/png" }),
    { contentType: "image/png", upsert: false },
  );

  return {
    kind: "screenshot",
    label,
    storagePath: artifact.storagePath,
    redacted: true,
    metadata: {
      runnerVersion: journeyRunnerFoundationVersion,
      runnerType: "journey",
    },
  };
}

async function stopAndUploadJourneyTrace(
  input: JourneyBrowserSessionInput,
  context: BrowserContext,
  tracePath: string,
): Promise<RunnerEvidenceArtifact> {
  await context.tracing.stop({ path: tracePath });
  const trace = await readFile(tracePath);
  const label = input.traceLabel ?? "journey-trace";
  const artifact = await uploadEvidenceArtifact(
    input.storageClient,
    {
      workspaceId: input.runnerContext.workspaceId,
      artifactKind: "run-artifact",
      ownerId: input.runnerContext.run.id,
      fileName: artifactFileName(label, "zip"),
    },
    new Blob([new Uint8Array(trace)], { type: "application/zip" }),
    { contentType: "application/zip", upsert: false },
  );

  return {
    kind: "trace",
    label,
    storagePath: artifact.storagePath,
    redacted: true,
    metadata: {
      runnerVersion: journeyRunnerFoundationVersion,
      runnerType: "journey",
    },
  };
}

async function withJourneyTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeout: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new JourneyRunnerFoundationError(`Journey runner exceeded ${timeoutMs}ms.`)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function boundedTimeout(value: number | undefined, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(value), 1_000), 120_000);
}

function artifactFileName(label: string, extension: string) {
  const safeLabel = label.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "") || "journey";
  return `${safeLabel}-${randomUUID()}.${extension}`;
}

function journeyErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Journey Runner foundation failed.";
}

export class JourneyRunnerFoundationError extends Error {
  readonly artifacts: RunnerEvidenceArtifact[];

  constructor(message: string, artifacts: RunnerEvidenceArtifact[] = []) {
    super(message);
    this.name = "JourneyRunnerFoundationError";
    this.artifacts = artifacts;
  }
}

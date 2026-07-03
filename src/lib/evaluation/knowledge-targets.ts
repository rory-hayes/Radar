import "server-only";

import {
  getAssertionById,
  listAssertionSourcesForAssertion,
  listSourceSyncTargetsForWorkspace,
  type RadarAssertionSource,
  type RadarRepositoryClient,
  type RadarSourceSyncTarget,
} from "@/lib/repositories";
import type { SourceSyncStatus, SourceType } from "@/lib/sources/schema";

export const knowledgeTargetKinds = [
  "ai_support_endpoint",
  "http_endpoint",
  "uploaded_answer_set",
  "manual_answer_set",
] as const;

export type KnowledgeTargetKind = (typeof knowledgeTargetKinds)[number];
export type KnowledgeTargetReadiness =
  | "ready"
  | "needs_endpoint_url"
  | "needs_synced_content"
  | "sync_error"
  | "unavailable";

export type KnowledgeTargetConfigurationInput = {
  workspaceId: string;
  assertionId: string;
};

export type KnowledgeTargetConfiguration = {
  workspaceId: string;
  assertionId: string;
  sourceId: string;
  name: string;
  description?: string;
  kind: KnowledgeTargetKind;
  sourceType: SourceType;
  targetUri?: string;
  httpMethod?: "GET" | "POST";
  authMode?: "none" | "bearer" | "basic" | "custom_header";
  syncStatus: SourceSyncStatus;
  lastSyncedAt?: string;
  contentHash?: string;
  isRequired: boolean;
  relationshipType: RadarAssertionSource["relationshipType"];
  purpose?: string;
  readiness: KnowledgeTargetReadiness;
  isReady: boolean;
  notes: readonly string[];
};

export type KnowledgeTargetConfigurationSet = {
  workspaceId: string;
  assertionId: string;
  isKnowledgeRunner: boolean;
  targets: readonly KnowledgeTargetConfiguration[];
  readyTargetCount: number;
  requiredTargetCount: number;
  missingRequiredTargetCount: number;
  unsupportedLinkedSourceCount: number;
  hasRunnableTarget: boolean;
};

export class KnowledgeTargetConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KnowledgeTargetConfigurationError";
  }
}

const targetCapableSourceTypes = [
  "support_bot_endpoint",
  "api_endpoint",
  "uploaded_document",
  "manual_text",
] as readonly SourceType[];

export async function loadKnowledgeTargetConfigurationsForAssertion(
  client: RadarRepositoryClient,
  input: KnowledgeTargetConfigurationInput,
): Promise<KnowledgeTargetConfigurationSet> {
  const assertion = await getAssertionById(client, input.workspaceId, input.assertionId);

  if (!assertion) {
    throw new KnowledgeTargetConfigurationError("Assertion was not found in this workspace.");
  }

  if (assertion.runnerType !== "knowledge") {
    return emptyTargetConfigurationSet(input, false);
  }

  const links = await listAssertionSourcesForAssertion(client, input.workspaceId, input.assertionId);
  const sources = await listSourceSyncTargetsForWorkspace(
    client,
    input.workspaceId,
    links.map((link) => link.sourceId),
  );
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const targets = links.flatMap<KnowledgeTargetConfiguration>((link) => {
    const source = sourceById.get(link.sourceId);

    if (!source) {
      return [];
    }

    const kind = knowledgeTargetKindForSourceType(source.type);

    if (!kind) {
      return [];
    }

    return [buildKnowledgeTarget(input.workspaceId, input.assertionId, link, source, kind)];
  });
  const readyTargetCount = targets.filter((target) => target.isReady).length;
  const requiredTargetCount = targets.filter((target) => target.isRequired).length;
  const unsupportedLinkedSourceCount = sources.filter((source) => !targetCapableSourceTypes.includes(source.type)).length;

  return {
    workspaceId: input.workspaceId,
    assertionId: input.assertionId,
    isKnowledgeRunner: true,
    targets,
    readyTargetCount,
    requiredTargetCount,
    missingRequiredTargetCount: targets.filter((target) => target.isRequired && !target.isReady).length,
    unsupportedLinkedSourceCount,
    hasRunnableTarget: readyTargetCount > 0,
  };
}

export function knowledgeTargetKindForSourceType(sourceType: SourceType): KnowledgeTargetKind | null {
  if (sourceType === "support_bot_endpoint") {
    return "ai_support_endpoint";
  }

  if (sourceType === "api_endpoint") {
    return "http_endpoint";
  }

  if (sourceType === "uploaded_document") {
    return "uploaded_answer_set";
  }

  if (sourceType === "manual_text") {
    return "manual_answer_set";
  }

  return null;
}

function buildKnowledgeTarget(
  workspaceId: string,
  assertionId: string,
  link: RadarAssertionSource,
  source: RadarSourceSyncTarget,
  kind: KnowledgeTargetKind,
): KnowledgeTargetConfiguration {
  const endpoint = kind === "ai_support_endpoint" || kind === "http_endpoint";
  const readiness = endpoint ? endpointReadiness(source) : answerSetReadiness(source);
  const config = source.config;

  return {
    workspaceId,
    assertionId,
    sourceId: source.id,
    name: source.name,
    description: source.description,
    kind,
    sourceType: source.type,
    targetUri: endpoint ? source.originUri : undefined,
    httpMethod: endpoint ? httpMethodFromConfig(config.httpMethod) : undefined,
    authMode: endpoint ? authModeFromConfig(config.authMode) : undefined,
    syncStatus: source.syncStatus,
    lastSyncedAt: source.lastSyncedAt,
    contentHash: source.contentHash,
    isRequired: link.isRequired,
    relationshipType: link.relationshipType,
    purpose: link.purpose,
    readiness,
    isReady: readiness === "ready",
    notes: readinessNotes(readiness, kind),
  };
}

function endpointReadiness(source: RadarSourceSyncTarget): KnowledgeTargetReadiness {
  if (!source.originUri) {
    return "needs_endpoint_url";
  }

  if (source.syncStatus === "error") {
    return "sync_error";
  }

  if (source.syncStatus === "archived" || source.syncStatus === "paused") {
    return "unavailable";
  }

  return "ready";
}

function answerSetReadiness(source: RadarSourceSyncTarget): KnowledgeTargetReadiness {
  if (source.syncStatus === "error") {
    return "sync_error";
  }

  if (source.syncStatus === "archived" || source.syncStatus === "paused") {
    return "unavailable";
  }

  if (!source.contentHash || !["ready", "synced"].includes(source.syncStatus)) {
    return "needs_synced_content";
  }

  return "ready";
}

function httpMethodFromConfig(value: unknown) {
  return value === "POST" ? "POST" : "GET";
}

function authModeFromConfig(value: unknown) {
  if (value === "bearer" || value === "basic" || value === "custom_header") {
    return value;
  }

  return "none";
}

function readinessNotes(readiness: KnowledgeTargetReadiness, kind: KnowledgeTargetKind) {
  if (readiness === "ready") {
    return kind === "uploaded_answer_set" || kind === "manual_answer_set"
      ? ["Answer sample content is available for Knowledge Runner execution."]
      : ["Endpoint URL is configured; credentials are referenced by mode only."];
  }

  if (readiness === "needs_endpoint_url") {
    return ["Add an http or https endpoint URL before this target can run."];
  }

  if (readiness === "needs_synced_content") {
    return ["Sync or upload answer-set content before this target can run."];
  }

  if (readiness === "sync_error") {
    return ["Resolve the source sync error before using this target."];
  }

  return ["This source is paused or archived and cannot be used as a target."];
}

function emptyTargetConfigurationSet(
  input: KnowledgeTargetConfigurationInput,
  isKnowledgeRunner: boolean,
): KnowledgeTargetConfigurationSet {
  return {
    workspaceId: input.workspaceId,
    assertionId: input.assertionId,
    isKnowledgeRunner,
    targets: [],
    readyTargetCount: 0,
    requiredTargetCount: 0,
    missingRequiredTargetCount: 0,
    unsupportedLinkedSourceCount: 0,
    hasRunnableTarget: false,
  };
}

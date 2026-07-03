import "server-only";

import { type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  evidenceArtifactDownloadUrlResponseSchema,
  evidenceArtifactPathRequestSchema,
  evidenceArtifactSignedUrlRequestSchema,
  evidenceArtifactUploadUrlResponseSchema,
  type EvidenceArtifactKind,
  type EvidenceArtifactPathRequest,
  type EvidenceArtifactSignedUrlRequest,
} from "@/lib/validation";

export const evidenceArtifactsBucket = "radar-evidence-artifacts" as const;
export const evidenceArtifactPathPattern = "<workspaceId>/<artifactKind>/<ownerId>/<fileName>" as const;

export type EvidenceArtifactPathParts = EvidenceArtifactPathRequest;
export type EvidenceStorageClient = Pick<SupabaseClient, "storage">;

export class RadarEvidenceStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RadarEvidenceStorageError";
  }
}

export function buildEvidenceArtifactPath(input: EvidenceArtifactPathRequest) {
  const parsedInput = evidenceArtifactPathRequestSchema.parse(input);

  return [
    parsedInput.workspaceId,
    parsedInput.artifactKind,
    parsedInput.ownerId,
    parsedInput.fileName,
  ].join("/");
}

export function parseEvidenceArtifactPath(storagePath: string): EvidenceArtifactPathParts {
  const [workspaceId, artifactKind, ownerId, fileName, ...extraSegments] = storagePath.split("/");

  if (!workspaceId || !artifactKind || !ownerId || !fileName || extraSegments.length > 0) {
    throw new RadarEvidenceStorageError(`Evidence artifact paths must match ${evidenceArtifactPathPattern}.`);
  }

  return evidenceArtifactPathRequestSchema.parse({
    workspaceId,
    artifactKind,
    ownerId,
    fileName,
  });
}

export function assertEvidenceArtifactPathForWorkspace(storagePath: string, workspaceId: string) {
  const parsedPath = parseEvidenceArtifactPath(storagePath);

  if (parsedPath.workspaceId !== workspaceId) {
    throw new RadarEvidenceStorageError("Evidence artifact path does not belong to the active workspace.");
  }

  return parsedPath;
}

export async function createEvidenceArtifactUploadUrl(
  client: EvidenceStorageClient,
  input: EvidenceArtifactPathRequest,
) {
  const storagePath = buildEvidenceArtifactPath(input);
  const { data, error } = await client.storage
    .from(evidenceArtifactsBucket)
    .createSignedUploadUrl(storagePath);

  assertStorageSuccess(error, "Unable to create evidence artifact upload URL.");

  const uploadData = data as { path?: string; signedUrl?: string; token?: string } | null;

  return evidenceArtifactUploadUrlResponseSchema.parse({
    bucket: evidenceArtifactsBucket,
    storagePath: uploadData?.path ?? storagePath,
    signedUrl: uploadData?.signedUrl,
    token: uploadData?.token,
  });
}

export async function createEvidenceArtifactDownloadUrl(
  client: EvidenceStorageClient,
  input: EvidenceArtifactSignedUrlRequest,
) {
  const parsedInput = evidenceArtifactSignedUrlRequestSchema.parse(input);
  assertEvidenceArtifactPathForWorkspace(parsedInput.storagePath, parsedInput.workspaceId);

  const { data, error } = await client.storage
    .from(evidenceArtifactsBucket)
    .createSignedUrl(parsedInput.storagePath, parsedInput.expiresInSeconds);

  assertStorageSuccess(error, "Unable to create evidence artifact download URL.");

  return evidenceArtifactDownloadUrlResponseSchema.parse({
    bucket: evidenceArtifactsBucket,
    storagePath: parsedInput.storagePath,
    signedUrl: data?.signedUrl,
    expiresInSeconds: parsedInput.expiresInSeconds,
  });
}

export async function uploadEvidenceArtifact(
  client: EvidenceStorageClient,
  input: EvidenceArtifactPathRequest,
  body: Blob,
  options: {
    contentType?: string;
    upsert?: boolean;
  } = {},
) {
  const storagePath = buildEvidenceArtifactPath(input);
  const { data, error } = await client.storage
    .from(evidenceArtifactsBucket)
    .upload(storagePath, body, {
      contentType: options.contentType,
      upsert: options.upsert ?? false,
    });

  assertStorageSuccess(error, "Unable to upload evidence artifact.");

  return {
    bucket: evidenceArtifactsBucket,
    storagePath: data?.path ?? storagePath,
  };
}

export async function removeEvidenceArtifact(
  client: EvidenceStorageClient,
  workspaceId: string,
  storagePath: string,
) {
  assertEvidenceArtifactPathForWorkspace(storagePath, workspaceId);

  const { error } = await client.storage.from(evidenceArtifactsBucket).remove([storagePath]);
  assertStorageSuccess(error, "Unable to remove evidence artifact.");
}

export function evidenceArtifactKindLabel(kind: EvidenceArtifactKind) {
  const labels = {
    "uploaded-document": "Uploaded document",
    "source-snapshot": "Source snapshot",
    screenshot: "Screenshot",
    "run-artifact": "Run artifact",
    "report-export": "Report export",
  } satisfies Record<EvidenceArtifactKind, string>;

  return labels[kind];
}

function assertStorageSuccess(error: unknown, fallbackMessage: string) {
  if (!error) {
    return;
  }

  if (error instanceof z.ZodError) {
    throw new RadarEvidenceStorageError(error.issues[0]?.message ?? fallbackMessage);
  }

  if (typeof error === "object" && error && "message" in error && typeof error.message === "string") {
    throw new RadarEvidenceStorageError(error.message);
  }

  throw new RadarEvidenceStorageError(fallbackMessage);
}

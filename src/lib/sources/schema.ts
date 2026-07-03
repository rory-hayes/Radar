import { z } from "zod";

export const sourceTypes = ["url", "uploaded_document", "manual_text", "api_endpoint", "support_bot_endpoint"] as const;

export const sourceSyncStatuses = ["draft", "ready", "syncing", "synced", "error", "paused", "archived"] as const;

export const sourceDocumentStatuses = ["pending", "extracting", "ready", "error", "archived"] as const;

export type SourceType = (typeof sourceTypes)[number];
export type SourceSyncStatus = (typeof sourceSyncStatuses)[number];
export type SourceDocumentStatus = (typeof sourceDocumentStatuses)[number];

export type RadarSource = {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  type: SourceType;
  syncStatus: SourceSyncStatus;
  originUri?: string;
  contentHash?: string;
  lastSyncedAt?: string;
  lastSyncError?: string;
  createdBy: string;
};

export type RadarSourceVersion = {
  id: string;
  workspaceId: string;
  sourceId: string;
  versionNumber: number;
  syncStatus: SourceSyncStatus;
  contentHash: string;
  documentCount: number;
  chunkCount: number;
};

export type RadarSourceDocument = {
  id: string;
  workspaceId: string;
  sourceId: string;
  sourceVersionId: string;
  title: string;
  documentUri?: string;
  mimeType?: string;
  storagePath?: string;
  status: SourceDocumentStatus;
  contentHash: string;
  byteSize?: number;
};

export type RadarSourceChunk = {
  id: string;
  workspaceId: string;
  sourceId: string;
  sourceDocumentId: string;
  chunkIndex: number;
  content: string;
  contentHash: string;
  tokenCount?: number;
};

export const sourceMetadataSchema = z.record(z.string(), z.unknown()).default({});

export const createSourceSchema = z.object({
  name: z.string().trim().min(2, "Source name must be at least 2 characters.").max(140),
  description: z.string().trim().max(500).optional(),
  type: z.enum(sourceTypes),
  originUri: z.string().trim().max(2048).optional(),
  config: sourceMetadataSchema,
  metadata: sourceMetadataSchema,
});

export const sourceVersionSchema = z.object({
  sourceId: z.uuid(),
  versionNumber: z.number().int().positive(),
  syncStatus: z.enum(sourceSyncStatuses),
  contentHash: z.string().trim().min(16).max(128),
  documentCount: z.number().int().min(0),
  chunkCount: z.number().int().min(0),
  metadata: sourceMetadataSchema,
});

export const sourceDocumentSchema = z.object({
  sourceId: z.uuid(),
  sourceVersionId: z.uuid(),
  title: z.string().trim().min(2).max(180),
  documentUri: z.string().trim().max(2048).optional(),
  mimeType: z.string().trim().max(255).optional(),
  storagePath: z.string().trim().max(1024).optional(),
  status: z.enum(sourceDocumentStatuses),
  contentHash: z.string().trim().min(16).max(128),
  byteSize: z.number().int().min(0).optional(),
  metadata: sourceMetadataSchema,
});

export const sourceChunkSchema = z.object({
  sourceId: z.uuid(),
  sourceDocumentId: z.uuid(),
  chunkIndex: z.number().int().min(0),
  content: z.string().trim().min(1),
  contentHash: z.string().trim().min(16).max(128),
  tokenCount: z.number().int().positive().optional(),
  metadata: sourceMetadataSchema,
});

export type CreateSourceInput = z.infer<typeof createSourceSchema>;
export type SourceVersionInput = z.infer<typeof sourceVersionSchema>;
export type SourceDocumentInput = z.infer<typeof sourceDocumentSchema>;
export type SourceChunkInput = z.infer<typeof sourceChunkSchema>;

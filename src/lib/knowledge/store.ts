import "server-only";

import { getOpenAIApiKey } from "@/lib/security/server-secrets";
import { getDefaultWorkspaceId, getSupabaseAdminClient } from "@/lib/supabase/server";
import { readEnv } from "@/lib/env";
import { writeAuditEvent } from "@/lib/workspace/store";
import type { GuidanceCard, GuidanceCitation, TranscriptSegment } from "@/lib/sessions/types";

export type KnowledgeSourceStatus = "processing" | "approved" | "rejected" | "archived" | "failed";
export type KnowledgeSourceType = "document" | "playbook" | "policy" | "faq" | "note";
export type KnowledgeUploadStatus = "processing" | "processed" | "failed";

export type KnowledgeSource = {
  id: string;
  workspaceId: string;
  title: string;
  sourceType: KnowledgeSourceType;
  uri?: string;
  status: KnowledgeSourceStatus;
  ownerEmail?: string;
  uploadedByEmail: string;
  approvedByEmail?: string;
  approvedAt?: string;
  chunkCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeUpload = {
  id: string;
  workspaceId: string;
  sourceId?: string;
  fileName?: string;
  contentType?: string;
  byteSize?: number;
  status: KnowledgeUploadStatus;
  uploadedByEmail: string;
  errorMessage?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeChunkMatch = {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  sourceType: KnowledgeSourceType;
  sourceUri?: string;
  chunkIndex: number;
  content: string;
  similarity: number;
  createdAt: string;
};

type SourceRow = {
  id: string;
  workspace_id: string;
  title: string;
  source_type: KnowledgeSourceType;
  uri: string | null;
  status: KnowledgeSourceStatus;
  owner_email: string | null;
  uploaded_by_email: string;
  approved_by_email: string | null;
  approved_at: string | null;
  chunk_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type UploadRow = {
  id: string;
  workspace_id: string;
  source_id: string | null;
  file_name: string | null;
  content_type: string | null;
  byte_size: number | null;
  status: KnowledgeUploadStatus;
  uploaded_by_email: string;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type MatchRow = {
  chunk_id: string;
  source_id: string;
  source_title: string;
  source_type: KnowledgeSourceType;
  source_uri: string | null;
  chunk_index: number;
  content: string;
  similarity: number;
  created_at: string;
};

const EMBEDDING_MODEL = readEnv(process.env.OPENAI_EMBEDDING_MODEL) ?? "text-embedding-3-small";
const MAX_UPLOAD_BYTES = 1_000_000;
const MIN_TEXT_LENGTH = 40;
const CHUNK_SIZE = 1_600;
const CHUNK_OVERLAP = 180;
const DEFAULT_MATCH_LIMIT = 4;
const DEFAULT_MIN_SIMILARITY = 0.68;

export function maxKnowledgeUploadBytes() {
  return MAX_UPLOAD_BYTES;
}

export async function ingestKnowledgeUpload(input: {
  workspaceId?: string;
  title: string;
  sourceType: KnowledgeSourceType;
  text: string;
  uploadedByEmail: string;
  ownerEmail?: string;
  uri?: string;
  fileName?: string;
  contentType?: string;
  byteSize?: number;
  approveForUse?: boolean;
}) {
  const workspaceId = input.workspaceId ?? getDefaultWorkspaceId();
  const text = normalizeKnowledgeText(input.text);

  if (text.length < MIN_TEXT_LENGTH) {
    throw new Error("Knowledge text is too short to ingest.");
  }

  if ((input.byteSize ?? Buffer.byteLength(text, "utf8")) > MAX_UPLOAD_BYTES) {
    throw new Error("Knowledge upload is larger than the configured limit.");
  }

  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const title = input.title.trim();
  const chunks = chunkText(text);

  const { data: sourceData, error: sourceError } = await supabase
    .from("radar_sources")
    .insert({
      workspace_id: workspaceId,
      title,
      source_type: input.sourceType,
      uri: input.uri?.trim() || null,
      status: "processing",
      owner_email: input.ownerEmail?.trim().toLowerCase() || null,
      uploaded_by_email: input.uploadedByEmail.trim().toLowerCase(),
      metadata: {
        ingestion: {
          model: EMBEDDING_MODEL,
          inputCharacters: text.length,
        },
      },
    })
    .select("*")
    .single();

  if (sourceError) {
    throw sourceError;
  }

  const source = sourceData as SourceRow;
  const { data: uploadData, error: uploadError } = await supabase
    .from("radar_uploads")
    .insert({
      workspace_id: workspaceId,
      source_id: source.id,
      file_name: input.fileName ?? null,
      content_type: input.contentType ?? null,
      byte_size: input.byteSize ?? Buffer.byteLength(text, "utf8"),
      status: "processing",
      uploaded_by_email: input.uploadedByEmail.trim().toLowerCase(),
      metadata: {
        sourceType: input.sourceType,
        chunkCount: chunks.length,
      },
    })
    .select("*")
    .single();

  if (uploadError) {
    await markSourceFailed(source.id, uploadError.message);
    throw uploadError;
  }

  const upload = uploadData as UploadRow;

  try {
    const embeddings = await createEmbeddings(chunks.map((chunk) => chunk.content));
    const { error: chunkError } = await supabase.from("radar_source_chunks").insert(
      chunks.map((chunk, index) => ({
        workspace_id: workspaceId,
        source_id: source.id,
        upload_id: upload.id,
        chunk_index: index,
        content: chunk.content,
        token_count: chunk.estimatedTokens,
        embedding: toPgVector(embeddings[index] ?? []),
        metadata: {
          title,
          sourceType: input.sourceType,
        },
      })),
    );

    if (chunkError) {
      throw chunkError;
    }

    const approved = input.approveForUse !== false;
    const { data: updatedSource, error: updateSourceError } = await supabase
      .from("radar_sources")
      .update({
        status: approved ? "approved" : "processing",
        approved_by_email: approved ? input.uploadedByEmail.trim().toLowerCase() : null,
        approved_at: approved ? now : null,
        chunk_count: chunks.length,
        updated_at: now,
      })
      .eq("id", source.id)
      .select("*")
      .single();

    if (updateSourceError) {
      throw updateSourceError;
    }

    const { data: updatedUpload, error: updateUploadError } = await supabase
      .from("radar_uploads")
      .update({
        status: "processed",
        updated_at: now,
      })
      .eq("id", upload.id)
      .select("*")
      .single();

    if (updateUploadError) {
      throw updateUploadError;
    }

    await writeAuditEvent({
      workspaceId,
      actorEmail: input.uploadedByEmail,
      action: "source.created",
      targetType: "source",
      targetId: source.id,
      metadata: {
        title,
        sourceType: input.sourceType,
        chunkCount: chunks.length,
        status: approved ? "approved" : "processing",
      },
    });

    return {
      source: toSource(updatedSource as SourceRow),
      upload: toUpload(updatedUpload as UploadRow),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Knowledge ingestion failed.";
    await markUploadFailed(upload.id, message);
    await markSourceFailed(source.id, message);
    throw error;
  }
}

export async function listKnowledgeSources(workspaceId = getDefaultWorkspaceId()) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("radar_sources")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  return ((data ?? []) as SourceRow[]).map(toSource);
}

export async function listKnowledgeUploads(workspaceId = getDefaultWorkspaceId()) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("radar_uploads")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  return ((data ?? []) as UploadRow[]).map(toUpload);
}

export async function getKnowledgeSource(id: string, workspaceId = getDefaultWorkspaceId()) {
  const supabase = getSupabaseAdminClient();
  const { data: source, error } = await supabase
    .from("radar_sources")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!source) {
    return null;
  }

  const { data: chunks, error: chunksError } = await supabase
    .from("radar_source_chunks")
    .select("id,chunk_index,content,token_count,created_at")
    .eq("workspace_id", workspaceId)
    .eq("source_id", id)
    .order("chunk_index", { ascending: true })
    .limit(20);

  if (chunksError) {
    throw chunksError;
  }

  return {
    ...toSource(source as SourceRow),
    chunks: chunks ?? [],
  };
}

export async function searchApprovedKnowledge(input: {
  workspaceId?: string;
  query: string;
  limit?: number;
  sessionId?: string;
  transcriptSegmentId?: string;
}) {
  const workspaceId = input.workspaceId ?? getDefaultWorkspaceId();
  const query = normalizeKnowledgeText(input.query).slice(0, 8_000);

  if (query.length < 12) {
    return [];
  }

  const [embedding] = await createEmbeddings([query]);
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("match_radar_source_chunks", {
    match_workspace_id: workspaceId,
    query_embedding: toPgVector(embedding),
    match_count: input.limit ?? DEFAULT_MATCH_LIMIT,
  });

  if (error) {
    throw error;
  }

  const matches = ((data ?? []) as MatchRow[]).map(toMatch);
  await supabase.from("radar_retrieval_events").insert({
    workspace_id: workspaceId,
    session_id: input.sessionId ?? null,
    transcript_segment_id: input.transcriptSegmentId ?? null,
    query,
    match_count: matches.length,
    top_similarity: matches[0]?.similarity ?? null,
  });

  return matches;
}

export async function buildGuidanceForSegment(input: {
  workspaceId: string;
  sessionId: string;
  segment: TranscriptSegment;
}): Promise<Omit<GuidanceCard, "id" | "createdAt">> {
  try {
    const matches = await searchApprovedKnowledge({
      workspaceId: input.workspaceId,
      query: input.segment.text,
      sessionId: input.sessionId,
      transcriptSegmentId: input.segment.id,
      limit: DEFAULT_MATCH_LIMIT,
    });
    const threshold = Number(readEnv(process.env.RADAR_RAG_MIN_SIMILARITY) ?? DEFAULT_MIN_SIMILARITY);
    const accepted = matches.filter((match) => match.similarity >= threshold).slice(0, 3);

    if (accepted.length === 0) {
      return needsConfirmationCard(input.segment, "No approved source matched this transcript segment.");
    }

    const citations = accepted.map((match): GuidanceCitation => ({
      segmentId: input.segment.id,
      source: "knowledge",
      title: match.sourceTitle,
      quote: match.content.slice(0, 320),
      url: match.sourceUri,
    }));

    return {
      sessionId: input.sessionId,
      lane: "proof",
      title: "Approved knowledge found",
      body:
        "Radar found approved workspace knowledge for this moment. Use only the cited excerpt and avoid adding unsupported claims.",
      citations,
      isLocalTest: false,
    };
  } catch {
    return needsConfirmationCard(input.segment, "Retrieval could not be completed for this transcript segment.");
  }
}

function needsConfirmationCard(
  segment: TranscriptSegment,
  reason: string,
): Omit<GuidanceCard, "id" | "createdAt"> {
  return {
    sessionId: segment.sessionId,
    lane: "needs_confirmation",
    title: "Needs confirmation",
    body: `${reason} Do not answer as fact until a cited source is available.`,
    citations: [],
    isLocalTest: false,
  };
}

async function createEmbeddings(inputs: string[]) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getOpenAIApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: inputs,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        data?: Array<{ index: number; embedding: number[] }>;
        error?: { message?: string };
      }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `OpenAI embeddings request failed with ${response.status}.`);
  }

  const embeddings = [...(payload?.data ?? [])].sort((left, right) => left.index - right.index);
  if (embeddings.length !== inputs.length) {
    throw new Error("OpenAI embeddings response did not include every input.");
  }

  return embeddings.map((item) => item.embedding);
}

async function markUploadFailed(uploadId: string, message: string) {
  await getSupabaseAdminClient()
    .from("radar_uploads")
    .update({
      status: "failed",
      error_message: message.slice(0, 1_000),
      updated_at: new Date().toISOString(),
    })
    .eq("id", uploadId);
}

async function markSourceFailed(sourceId: string, message: string) {
  await getSupabaseAdminClient()
    .from("radar_sources")
    .update({
      status: "failed",
      metadata: {
        error: message.slice(0, 1_000),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", sourceId);
}

function normalizeKnowledgeText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function chunkText(text: string) {
  const chunks: Array<{ content: string; estimatedTokens: number }> = [];
  let offset = 0;

  while (offset < text.length) {
    const end = Math.min(offset + CHUNK_SIZE, text.length);
    const slice = text.slice(offset, end);
    const nextBreak = slice.lastIndexOf("\n\n");
    const content =
      end < text.length && nextBreak > CHUNK_SIZE * 0.55 ? slice.slice(0, nextBreak).trim() : slice.trim();

    if (content.length > 0) {
      chunks.push({
        content,
        estimatedTokens: Math.ceil(content.length / 4),
      });
    }

    offset += Math.max(content.length - CHUNK_OVERLAP, CHUNK_SIZE - CHUNK_OVERLAP);
  }

  return chunks;
}

function toPgVector(vector: number[]) {
  if (vector.length === 0) {
    throw new Error("Embedding vector is empty.");
  }

  return `[${vector.join(",")}]`;
}

function toSource(row: SourceRow): KnowledgeSource {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    sourceType: row.source_type,
    uri: row.uri ?? undefined,
    status: row.status,
    ownerEmail: row.owner_email ?? undefined,
    uploadedByEmail: row.uploaded_by_email,
    approvedByEmail: row.approved_by_email ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    chunkCount: row.chunk_count,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toUpload(row: UploadRow): KnowledgeUpload {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    sourceId: row.source_id ?? undefined,
    fileName: row.file_name ?? undefined,
    contentType: row.content_type ?? undefined,
    byteSize: row.byte_size ?? undefined,
    status: row.status,
    uploadedByEmail: row.uploaded_by_email,
    errorMessage: row.error_message ?? undefined,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toMatch(row: MatchRow): KnowledgeChunkMatch {
  return {
    chunkId: row.chunk_id,
    sourceId: row.source_id,
    sourceTitle: row.source_title,
    sourceType: row.source_type,
    sourceUri: row.source_uri ?? undefined,
    chunkIndex: row.chunk_index,
    content: row.content,
    similarity: row.similarity,
    createdAt: row.created_at,
  };
}

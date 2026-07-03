"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { abusePayloadLimits } from "@/lib/abuse/limits";
import { checkAndRecordAbuseLimit } from "@/lib/abuse/enforcement";
import { trackProductEvent } from "@/lib/analytics/posthog";
import { recordAuditEvent } from "@/lib/audit/server";
import { getBillingGateResult } from "@/lib/billing/enforcement";
import {
  createSource,
  deleteSource,
  getSourceById,
  listSourceDocumentStoragePaths,
  updateSource,
} from "@/lib/repositories";
import {
  runWorkspaceServerAction,
  serverActionError,
  serverActionErrorState,
} from "@/lib/server/guardrails";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { persistUploadedDocumentSource } from "@/lib/sources/file-ingestion";
import { runSourceSyncJob } from "@/lib/sources/source-sync-jobs";
import { sourceTypes, type CreateSourceInput } from "@/lib/sources/schema";
import { removeEvidenceArtifacts } from "@/lib/storage";

const endpointMethods = ["GET", "POST"] as const;
const endpointAuthModes = ["none", "bearer", "basic", "custom_header"] as const;
const maxUploadBytes = abusePayloadLimits.uploadedDocumentMaxBytes;

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional(),
);

const sourceFormActionSchema = z
  .object({
    mode: z.enum(["create", "update"]),
    sourceId: optionalTrimmedString.pipe(z.uuid().optional()),
    name: z.string().trim().min(2, "Source name must be at least 2 characters.").max(140),
    description: optionalTrimmedString.pipe(z.string().max(500).optional()),
    type: z.enum(sourceTypes),
    originUri: optionalTrimmedString.pipe(z.string().max(2048).optional()),
    manualText: optionalTrimmedString.pipe(z.string().max(abusePayloadLimits.manualTextMaxCharacters).optional()),
    endpointMethod: z.enum(endpointMethods).default("GET"),
    endpointAuthMode: z.enum(endpointAuthModes).default("none"),
    uploadedFileName: optionalTrimmedString.pipe(z.string().max(255).optional()),
    uploadedFileType: optionalTrimmedString.pipe(z.string().max(255).optional()),
    uploadedFileSize: z.number().int().min(0).max(maxUploadBytes).optional(),
  })
  .superRefine((input, context) => {
    if (input.mode === "update" && !input.sourceId) {
      context.addIssue({
        code: "custom",
        path: ["sourceId"],
        message: "Source id is required when updating a source.",
      });
    }

    if (["url", "api_endpoint", "support_bot_endpoint"].includes(input.type) && !isValidHttpUrl(input.originUri)) {
      context.addIssue({
        code: "custom",
        path: ["originUri"],
        message: "Enter a valid http or https URL for this source.",
      });
    }

    if (input.type === "manual_text" && input.mode === "create" && (input.manualText?.length ?? 0) < 20) {
      context.addIssue({
        code: "custom",
        path: ["manualText"],
        message: "Manual text sources need at least 20 characters.",
      });
    }

    if (input.type === "uploaded_document" && input.mode === "create" && !input.originUri && !input.uploadedFileName) {
      context.addIssue({
        code: "custom",
        path: ["uploadedFileName"],
        message: "Attach a file or enter a document reference.",
      });
    }
  });

type SourceFormInput = z.infer<typeof sourceFormActionSchema>;
const sourceResyncActionSchema = z.object({
  sourceId: z.uuid(),
});
const sourceDeleteActionSchema = z.object({
  sourceId: z.uuid(),
  confirmationName: z.string().trim().min(1, "Type the source name to confirm deletion."),
});

export type SourceFormState = {
  error?: string;
};
export type SourceDeleteState = SourceFormState;

export async function createSourceAction(
  _previousState: SourceFormState,
  formData: FormData,
): Promise<SourceFormState> {
  const uploadedFile = uploadedFileFromFormData(formData);
  const result = await runWorkspaceServerAction(
    {
      input: sourceFormInputFromFormData("create", formData, uploadedFile),
      permission: "source:create",
      schema: sourceFormActionSchema,
    },
    async ({ input, membership, user }) => {
      const supabase = await createSupabaseServerClient();

      if (!supabase) {
        throw serverActionError("Supabase is not configured for this environment.");
      }

      const gate = await getBillingGateResult({
        client: supabase,
        workspaceId: membership.workspace.id,
        action: "create_source",
      });

      if (!gate.allowed) {
        throw serverActionError(gate.message ?? "This workspace has reached its billing plan limit.", "validation");
      }

      if (uploadedFile) {
        const uploadLimit = await checkAndRecordAbuseLimit({
          client: supabase,
          workspaceId: membership.workspace.id,
          userId: user.id,
          eventType: "file_upload",
          metadata: {
            fileSize: uploadedFile.size,
            fileType: uploadedFile.type || "unknown",
            sourceType: input.type,
          },
        });

        if (!uploadLimit.allowed) {
          throw serverActionError(uploadLimit.message, "rate_limited");
        }
      }

      const source = await createSource(supabase, membership.workspace.id, user.id, buildCreateSourceInput(input));

      if (input.type === "uploaded_document" && uploadedFile) {
        try {
          await persistUploadedDocumentSource(supabase, membership.workspace.id, source.id, uploadedFile);
        } catch (error) {
          throw serverActionError(uploadFailureMessage(error));
        }
      }

      await trackProductEvent({
        event: "source_added",
        properties: {
          workspaceId: membership.workspace.id,
          userId: user.id,
          sourceId: source.id,
          sourceType: source.type,
        },
      });

      return source;
    },
  );

  const error = serverActionErrorState(result);

  if (error) {
    return { error };
  }

  revalidatePath("/sources");
  redirect("/sources");
}

export async function updateSourceAction(
  _previousState: SourceFormState,
  formData: FormData,
): Promise<SourceFormState> {
  const uploadedFile = uploadedFileFromFormData(formData);
  const result = await runWorkspaceServerAction(
    {
      input: sourceFormInputFromFormData("update", formData, uploadedFile),
      permission: "source:edit",
      schema: sourceFormActionSchema,
    },
    async ({ input, membership, user }) => {
      const supabase = await createSupabaseServerClient();

      if (!supabase) {
        throw serverActionError("Supabase is not configured for this environment.");
      }

      if (!input.sourceId) {
        throw serverActionError("Source id is required when updating a source.", "validation");
      }

      if (input.type === "uploaded_document" && uploadedFile) {
        const uploadLimit = await checkAndRecordAbuseLimit({
          client: supabase,
          workspaceId: membership.workspace.id,
          userId: user.id,
          eventType: "file_upload",
          metadata: {
            fileSize: uploadedFile.size,
            fileType: uploadedFile.type || "unknown",
            sourceType: input.type,
            sourceId: input.sourceId,
          },
        });

        if (!uploadLimit.allowed) {
          throw serverActionError(uploadLimit.message, "rate_limited");
        }
      }

      const source = await updateSource(supabase, membership.workspace.id, input.sourceId, buildUpdateSourceInput(input));

      if (input.type === "uploaded_document" && uploadedFile) {
        try {
          await persistUploadedDocumentSource(supabase, membership.workspace.id, source.id, uploadedFile);
        } catch (error) {
          throw serverActionError(uploadFailureMessage(error));
        }
      }

      return source;
    },
  );

  const error = serverActionErrorState(result);

  if (error) {
    return { error };
  }

  revalidatePath("/sources");
  redirect("/sources");
}

export async function resyncSourceAction(formData: FormData): Promise<void> {
  const result = await runWorkspaceServerAction(
    {
      input: {
        sourceId: String(formData.get("sourceId") ?? ""),
      },
      permission: "source:edit",
      schema: sourceResyncActionSchema,
    },
    async ({ input, membership, user }) => {
      const supabase = await createSupabaseServerClient();

      if (!supabase) {
        throw serverActionError("Supabase is not configured for this environment.");
      }

      const limit = await checkAndRecordAbuseLimit({
        client: supabase,
        workspaceId: membership.workspace.id,
        userId: user.id,
        eventType: "source_sync",
        metadata: {
          sourceId: input.sourceId,
          reason: "manual",
          boundary: "server_action",
        },
      });

      if (!limit.allowed) {
        throw serverActionError(limit.message, "rate_limited");
      }

      return runSourceSyncJob(supabase, {
        workspaceId: membership.workspace.id,
        sourceId: input.sourceId,
        reason: "manual",
        requestedByUserId: user.id,
      });
    },
  );

  if (result.ok) {
    const sourceId = result.data.sourceId;

    revalidatePath("/sources");
    revalidatePath(`/sources/${sourceId}`);
  }

}

export async function deleteSourceAction(
  _previousState: SourceDeleteState,
  formData: FormData,
): Promise<SourceDeleteState> {
  const result = await runWorkspaceServerAction(
    {
      input: {
        sourceId: String(formData.get("sourceId") ?? ""),
        confirmationName: String(formData.get("confirmationName") ?? ""),
      },
      permission: "source:delete",
      schema: sourceDeleteActionSchema,
    },
    async ({ input, membership, user }) => {
      const supabase = await createSupabaseServerClient();

      if (!supabase) {
        throw serverActionError("Supabase is not configured for this environment.");
      }

      const source = await getSourceById(supabase, membership.workspace.id, input.sourceId);

      if (!source) {
        throw serverActionError("Source not found for this workspace.", "validation");
      }

      if (input.confirmationName !== source.name) {
        throw serverActionError("Type the source name exactly to confirm deletion.", "validation");
      }

      const storagePaths = await listSourceDocumentStoragePaths(supabase, membership.workspace.id, source.id);
      const storageCleanup = await removeEvidenceArtifacts(supabase, membership.workspace.id, storagePaths);

      await deleteSource(supabase, membership.workspace.id, source.id);

      const auditResult = await recordAuditEvent({
        workspaceId: membership.workspace.id,
        action: "source.deleted",
        resourceType: "source",
        resourceId: source.id,
        metadata: {
          sourceName: source.name,
          sourceType: source.type,
          removedArtifactCount: storageCleanup.removedCount,
          deletedByUserId: user.id,
        },
      });

      if (auditResult.error) {
        throw serverActionError(auditResult.error);
      }

      return source;
    },
  );

  const error = serverActionErrorState(result);

  if (error) {
    return { error };
  }

  revalidatePath("/sources");
  redirect("/sources");
}

function sourceFormInputFromFormData(mode: SourceFormInput["mode"], formData: FormData, uploadedFile: File | null) {
  const uploadedFileMetadata = uploadedFile
    ? {
        uploadedFileName: uploadedFile.name,
        uploadedFileType: uploadedFile.type || undefined,
        uploadedFileSize: uploadedFile.size,
      }
    : {};

  return {
    mode,
    sourceId: String(formData.get("sourceId") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    type: String(formData.get("type") ?? "url"),
    originUri: String(formData.get("originUri") ?? ""),
    manualText: String(formData.get("manualText") ?? ""),
    endpointMethod: String(formData.get("endpointMethod") ?? "GET"),
    endpointAuthMode: String(formData.get("endpointAuthMode") ?? "none"),
    ...uploadedFileMetadata,
  };
}

function uploadedFileFromFormData(formData: FormData) {
  const uploadedFile = formData.get("uploadedFile");

  return uploadedFile instanceof File && uploadedFile.size > 0 ? uploadedFile : null;
}

function uploadFailureMessage(error: unknown) {
  return error instanceof Error ? error.message : "Uploaded document extraction failed.";
}

function buildCreateSourceInput(input: SourceFormInput): CreateSourceInput {
  return {
    name: input.name,
    description: input.description,
    type: input.type,
    originUri: input.originUri,
    config: sourceConfigFromInput(input),
    metadata: sourceMetadataFromInput(input, "created"),
  };
}

function buildUpdateSourceInput(input: SourceFormInput): Partial<CreateSourceInput> {
  const config = sourceConfigFromInput(input);
  const updateInput: Partial<CreateSourceInput> = {
    name: input.name,
    description: input.description,
    type: input.type,
    originUri: input.originUri,
    metadata: sourceMetadataFromInput(input, "updated"),
  };

  if (Object.keys(config).length > 0) {
    updateInput.config = config;
  }

  return updateInput;
}

function sourceConfigFromInput(input: SourceFormInput) {
  const config: Record<string, unknown> = {};

  if (input.type === "manual_text" && input.manualText) {
    config.manualText = input.manualText;
  }

  if (["api_endpoint", "support_bot_endpoint"].includes(input.type)) {
    config.httpMethod = input.endpointMethod;
    config.authMode = input.endpointAuthMode;
  }

  if (input.type === "uploaded_document" && input.uploadedFileName) {
    config.uploadedFile = {
      name: input.uploadedFileName,
      mimeType: input.uploadedFileType,
      byteSize: input.uploadedFileSize,
      storageStatus: "pending_upload_pipeline",
    };
  }

  return config;
}

function sourceMetadataFromInput(input: SourceFormInput, action: "created" | "updated") {
  return {
    formVersion: "rad-032",
    formAction: action,
    sourceFormType: input.type,
  };
}

function isValidHttpUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

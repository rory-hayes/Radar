"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSource, updateSource } from "@/lib/repositories";
import {
  runWorkspaceServerAction,
  serverActionError,
  serverActionErrorState,
} from "@/lib/server/guardrails";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sourceTypes, type CreateSourceInput } from "@/lib/sources/schema";

const endpointMethods = ["GET", "POST"] as const;
const endpointAuthModes = ["none", "bearer", "basic", "custom_header"] as const;
const maxUploadBytes = 10 * 1024 * 1024;

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
    manualText: optionalTrimmedString.pipe(z.string().max(50000).optional()),
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

export type SourceFormState = {
  error?: string;
};

export async function createSourceAction(
  _previousState: SourceFormState,
  formData: FormData,
): Promise<SourceFormState> {
  const result = await runWorkspaceServerAction(
    {
      input: sourceFormInputFromFormData("create", formData),
      permission: "source:create",
      schema: sourceFormActionSchema,
    },
    async ({ input, membership, user }) => {
      const supabase = await createSupabaseServerClient();

      if (!supabase) {
        throw serverActionError("Supabase is not configured for this environment.");
      }

      return createSource(supabase, membership.workspace.id, user.id, buildCreateSourceInput(input));
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
  const result = await runWorkspaceServerAction(
    {
      input: sourceFormInputFromFormData("update", formData),
      permission: "source:edit",
      schema: sourceFormActionSchema,
    },
    async ({ input, membership }) => {
      const supabase = await createSupabaseServerClient();

      if (!supabase) {
        throw serverActionError("Supabase is not configured for this environment.");
      }

      if (!input.sourceId) {
        throw serverActionError("Source id is required when updating a source.", "validation");
      }

      return updateSource(supabase, membership.workspace.id, input.sourceId, buildUpdateSourceInput(input));
    },
  );

  const error = serverActionErrorState(result);

  if (error) {
    return { error };
  }

  revalidatePath("/sources");
  redirect("/sources");
}

function sourceFormInputFromFormData(mode: SourceFormInput["mode"], formData: FormData) {
  const uploadedFile = formData.get("uploadedFile");
  const uploadedFileMetadata = uploadedFile instanceof File && uploadedFile.size > 0
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

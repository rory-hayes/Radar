import { NextResponse } from "next/server";

import { can, getAdminContext } from "@/lib/admin-data";
import { ingestKnowledgeUpload, maxKnowledgeUploadBytes } from "@/lib/knowledge/store";
import { KnowledgeSourceTypeSchema } from "@/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const context = await getAdminContext();

  if (context.state === "not_configured") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "not_configured",
          message: "Sign in and connect Supabase before uploading knowledge.",
          missing: context.missingConfig,
        },
      },
      { status: 503 },
    );
  }

  if (!can(context, "manageSources")) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "forbidden",
          message: "Your current role cannot upload workspace knowledge.",
        },
      },
      { status: 403 },
    );
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "invalid_request",
          message: "Knowledge uploads must use form data.",
        },
      },
      { status: 400 },
    );
  }

  const title = readFormString(form, "title");
  const sourceType = KnowledgeSourceTypeSchema.safeParse(readFormString(form, "sourceType") || "document");
  const ownerEmail = readFormString(form, "ownerEmail");
  const uri = readFormString(form, "uri");
  const pastedText = readFormString(form, "text");
  const file = form.get("file");

  if (!title || title.length > 180 || !sourceType.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "invalid_request",
          message: "Enter a title and source type for this knowledge upload.",
        },
      },
      { status: 400 },
    );
  }

  let fileText: Awaited<ReturnType<typeof readUploadFile>> | null = null;

  try {
    fileText = file instanceof File && file.size > 0 ? await readUploadFile(file) : null;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "unsupported_file",
          message: error instanceof Error ? error.message : "This file type is not supported.",
        },
      },
      { status: 400 },
    );
  }
  const text = fileText?.text || pastedText;
  const byteSize = fileText?.byteSize ?? Buffer.byteLength(text ?? "", "utf8");

  if (!text || text.trim().length < 40) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "invalid_request",
          message: "Upload or paste at least 40 characters of source text.",
        },
      },
      { status: 400 },
    );
  }

  if (byteSize > maxKnowledgeUploadBytes()) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "upload_too_large",
          message: "Knowledge uploads are limited to 1 MB for this V1 ingestion path.",
        },
      },
      { status: 413 },
    );
  }

  try {
    const result = await ingestKnowledgeUpload({
      workspaceId: context.workspaceId,
      title,
      sourceType: sourceType.data,
      text,
      uploadedByEmail: context.authEmail,
      ownerEmail,
      uri,
      fileName: fileText?.fileName,
      contentType: fileText?.contentType,
      byteSize,
      approveForUse: true,
    });

    return NextResponse.json(
      {
        ok: true,
        source: result.source,
        upload: result.upload,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "ingestion_failed",
          message: error instanceof Error ? error.message : "Knowledge ingestion failed.",
        },
      },
      { status: 502 },
    );
  }
}

function readFormString(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function readUploadFile(file: File) {
  if (!isSupportedTextFile(file)) {
    throw new Error("Only text, markdown, CSV, JSON, HTML, and XML uploads are supported in V1.");
  }

  return {
    text: await file.text(),
    fileName: file.name,
    contentType: file.type || "text/plain",
    byteSize: file.size,
  };
}

function isSupportedTextFile(file: File) {
  const supportedTypes = new Set([
    "text/plain",
    "text/markdown",
    "text/csv",
    "text/html",
    "application/json",
    "application/xml",
    "text/xml",
  ]);
  const lowerName = file.name.toLowerCase();

  return (
    supportedTypes.has(file.type) ||
    [".txt", ".md", ".markdown", ".csv", ".json", ".html", ".xml"].some((suffix) =>
      lowerName.endsWith(suffix),
    )
  );
}

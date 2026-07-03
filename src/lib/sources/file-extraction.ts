import "server-only";

import { hashText } from "@/lib/sources/url-crawler";

export type ExtractedUploadedDocument = {
  fileName: string;
  mimeType: string;
  byteSize: number;
  text: string;
  contentHash: string;
  metadata: {
    extension: string;
    extractionMethod: "plain_text" | "markdown" | "basic_pdf";
  };
};

type ExtractUploadedDocumentOptions = {
  maxBytes?: number;
};

const defaultMaxBytes = 10 * 1024 * 1024;
const supportedMimeTypes = {
  "text/plain": "plain_text",
  "text/markdown": "markdown",
  "text/x-markdown": "markdown",
  "application/pdf": "basic_pdf",
} as const;

const extensionMimeTypes = {
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".markdown": "text/markdown",
  ".pdf": "application/pdf",
} as const;

export async function extractUploadedDocument(
  file: File,
  options: ExtractUploadedDocumentOptions = {},
): Promise<ExtractedUploadedDocument> {
  const maxBytes = options.maxBytes ?? defaultMaxBytes;
  const fileName = sanitizeUploadedFileName(file.name);
  const extension = extensionForFileName(fileName);
  const mimeType = normalizeMimeType(file.type, extension);

  if (file.size <= 0) {
    throw new FileExtractionError("empty_file", "Uploaded document is empty.");
  }

  if (file.size > maxBytes) {
    throw new FileExtractionError("size_limit", `Uploaded document exceeds ${maxBytes} bytes.`);
  }

  if (!mimeType || !(mimeType in supportedMimeTypes)) {
    throw new FileExtractionError("unsupported_type", "Upload a PDF, Markdown, or TXT document.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  scanUploadedDocumentBuffer(buffer, {
    fileName,
    mimeType,
    extension,
  });

  const extractionMethod = supportedMimeTypes[mimeType as keyof typeof supportedMimeTypes];
  const text = normalizeExtractedText(
    extractionMethod === "basic_pdf"
      ? extractBasicPdfText(buffer)
      : extractTextDocument(buffer, extractionMethod),
  );

  if (!text) {
    throw new FileExtractionError("empty_text", "Uploaded document did not contain extractable text.");
  }

  return {
    fileName,
    mimeType,
    byteSize: file.size,
    text,
    contentHash: hashText(text),
    metadata: {
      extension,
      extractionMethod,
    },
  };
}

export class FileExtractionError extends Error {
  readonly code: "empty_file" | "size_limit" | "unsupported_type" | "unsafe_file" | "empty_text" | "pdf_text_unavailable";

  constructor(code: FileExtractionError["code"], message: string) {
    super(message);
    this.name = "FileExtractionError";
    this.code = code;
  }
}

export function sanitizeUploadedFileName(fileName: string) {
  const cleaned = fileName
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .toLowerCase();

  return cleaned || "uploaded-document";
}

export function scanUploadedDocumentBuffer(
  buffer: Buffer,
  input: {
    fileName: string;
    mimeType: string;
    extension: string;
  },
) {
  const signature = buffer.subarray(0, 8);

  if (hasBlockedBinarySignature(signature)) {
    throw new FileExtractionError("unsafe_file", "Uploaded document failed the safety scan.");
  }

  if (input.mimeType !== "application/pdf" && looksLikeHtmlOrScript(buffer)) {
    throw new FileExtractionError("unsafe_file", "Uploaded text document contains unsafe HTML or script content.");
  }

  if (/^(exe|dll|dmg|pkg|app|sh|bat|cmd|ps1|js|mjs|vbs)$/i.test(input.extension)) {
    throw new FileExtractionError("unsafe_file", "Upload a PDF, Markdown, or TXT document.");
  }
}

function hasBlockedBinarySignature(signature: Buffer) {
  const hex = signature.toString("hex");

  return (
    hex.startsWith("4d5a") ||
    hex.startsWith("7f454c46") ||
    hex.startsWith("cafebabe") ||
    hex.startsWith("feedface") ||
    hex.startsWith("feedfacf") ||
    hex.startsWith("cefaedfe") ||
    hex.startsWith("cffaedfe")
  );
}

function looksLikeHtmlOrScript(buffer: Buffer) {
  const preview = buffer.subarray(0, 4096).toString("utf8").toLowerCase();

  return /<\s*script\b|<\s*iframe\b|javascript:|onerror\s*=|onload\s*=|<!doctype\s+html|<\s*html\b/.test(preview);
}

function extractTextDocument(buffer: Buffer, method: "plain_text" | "markdown") {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);

  if (method === "markdown") {
    return text
      .replace(/^---[\s\S]*?---\s*/m, "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
      .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
      .replace(/[#>*_`~|]/g, " ");
  }

  return text;
}

function extractBasicPdfText(buffer: Buffer) {
  const pdf = buffer.toString("latin1");

  if (!pdf.startsWith("%PDF")) {
    throw new FileExtractionError("unsupported_type", "PDF upload is missing a PDF header.");
  }

  const literalStrings = Array.from(pdf.matchAll(/\((?:\\.|[^\\)]){2,}\)\s*Tj/g), (match) =>
    decodePdfLiteralString(match[0].replace(/\)\s*Tj$/, "").slice(1, -1)),
  );
  const arrayStrings = Array.from(pdf.matchAll(/\[(.*?)\]\s*TJ/gs), (match) =>
    Array.from(match[1]?.matchAll(/\((?:\\.|[^\\)])+?\)/g) ?? [], (part) =>
      decodePdfLiteralString(part[0].slice(1, -1)),
    ).join(" "),
  );
  const text = [...literalStrings, ...arrayStrings].join("\n");

  if (!text.trim()) {
    throw new FileExtractionError(
      "pdf_text_unavailable",
      "PDF text could not be extracted. Upload a text-based PDF or a TXT/Markdown source.",
    );
  }

  return text;
}

function normalizeExtractedText(value: string) {
  return value
    .replace(/\u0000/g, " ")
    .replace(/\r/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodePdfLiteralString(value: string) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, " ")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

function normalizeMimeType(mimeType: string, extension: string) {
  const lowerMimeType = mimeType.split(";")[0]?.trim().toLowerCase();

  if (lowerMimeType && lowerMimeType in supportedMimeTypes) {
    return lowerMimeType;
  }

  return extensionMimeTypes[extension as keyof typeof extensionMimeTypes];
}

function extensionForFileName(fileName: string) {
  const match = /\.[^.]+$/.exec(fileName);
  return match?.[0]?.toLowerCase() ?? "";
}

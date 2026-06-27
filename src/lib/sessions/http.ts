import { NextResponse } from "next/server";
import type { z } from "zod";

const BASE_CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};

function normalizeAllowedOrigin(origin: string) {
  const trimmed = origin.trim();

  try {
    const parsed = new URL(trimmed);

    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.origin;
    }
  } catch {
    return trimmed;
  }

  return trimmed.replace(/\/+$/, "");
}

function configuredOrigins() {
  const origins = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.AUTH_URL,
    ...(process.env.RADAR_EXTENSION_ORIGIN ?? "").split(","),
  ];

  return new Set(
    origins
      .flatMap((origin) => {
        const trimmed = origin?.trim();
        return trimmed ? [trimmed] : [];
      })
      .map(normalizeAllowedOrigin),
  );
}

function isAllowedOrigin(origin: string) {
  const allowedOrigins = configuredOrigins();

  if (allowedOrigins.has(origin)) {
    return true;
  }

  return process.env.NODE_ENV !== "production" && allowedOrigins.size === 0;
}

export function assertAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin || isAllowedOrigin(origin)) {
    return;
  }

  throw new ApiError(
    403,
    "origin_not_allowed",
    "This Radar API origin is not allowed. Configure RADAR_EXTENSION_ORIGIN for the installed extension.",
  );
}

export function corsHeaders(request?: Request) {
  const origin = request?.headers.get("origin");
  const headers: Record<string, string> = { ...BASE_CORS_HEADERS };

  if (origin && isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  }

  return headers;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export function json(data: unknown, init?: ResponseInit, request?: Request) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...corsHeaders(request),
      ...init?.headers,
    },
  });
}

export function optionsResponse(request?: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

export async function readJson<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
): Promise<z.output<TSchema>> {
  assertAllowedOrigin(request);

  const rawBody = await request.text().catch(() => {
    throw new ApiError(400, "invalid_json", "Request body must be readable.");
  });
  let body: unknown = {};

  if (rawBody.trim()) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      throw new ApiError(400, "invalid_json", "Request body must be valid JSON.");
    }
  }

  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) {
    throw new ApiError(
      400,
      "invalid_request",
      "Request body does not match the expected shape.",
      parsed.error.flatten(),
    );
  }

  return parsed.data;
}

export function jsonError(error: unknown, request?: Request) {
  if (error instanceof ApiError) {
    return json(
      {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status },
      request,
    );
  }

  return json(
    {
      ok: false,
      error: {
        code: "internal_error",
        message: "Radar could not complete the request.",
      },
    },
    { status: 500 },
    request,
  );
}

export function assertFound<T>(value: T | undefined, code = "not_found", message = "Not found."): T {
  if (!value) {
    throw new ApiError(404, code, message);
  }

  return value;
}

export function parseAfterCursor(url: string) {
  const value = new URL(url).searchParams.get("after");
  if (!value) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new ApiError(400, "invalid_cursor", "`after` must be a non-negative event sequence.");
  }

  return parsed;
}

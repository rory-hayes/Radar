import { NextResponse } from "next/server";
import type { z } from "zod";

export const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.RADAR_EXTENSION_ORIGIN?.trim() || "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Max-Age": "86400",
};

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

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...corsHeaders,
      ...init?.headers,
    },
  });
}

export function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function readJson<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
): Promise<z.output<TSchema>> {
  const body = await request.json().catch(() => {
    throw new ApiError(400, "invalid_json", "Request body must be valid JSON.");
  });

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

export function jsonError(error: unknown) {
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

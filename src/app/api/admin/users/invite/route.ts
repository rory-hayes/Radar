import { NextResponse } from "next/server";

import { requireApiAuth } from "@/lib/auth/api";
import { can, getAdminContext } from "@/lib/admin-data";
import { ApiError } from "@/lib/sessions/http";
import { InviteUserSchema } from "@/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireApiAuth();
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.status },
      );
    }

    throw error;
  }

  const json = await request.json().catch(() => null);
  const parsed = InviteUserSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "invalid_request",
          message: "Enter a valid invite email and role.",
          details: parsed.error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  const context = await getAdminContext();

  if (context.state === "not_configured") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "admin_api_not_configured",
          message: "Connect the admin API before inviting users.",
          missing: context.missingConfig,
        },
      },
      { status: 503 },
    );
  }

  if (!can(context, "manageUsers")) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "forbidden",
          message: "Your current role cannot invite workspace users.",
        },
      },
      { status: 403 },
    );
  }

  try {
    const upstream = await fetch(toAdminUrl(context.apiBaseUrl, "users/invites"), {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${process.env.RADAR_ADMIN_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed.data),
    });

    const payload = await readOptionalJson(upstream);

    if (!upstream.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "invite_failed",
            message:
              upstream.status === 409
                ? "That email already has access or a pending invite."
                : `The admin API returned ${upstream.status}.`,
            details: payload,
          },
        },
        { status: upstream.status },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        invite: normalizePayload(payload),
      },
      { status: upstream.status === 204 ? 200 : upstream.status },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "admin_api_unreachable",
          message: "The admin API could not be reached from the server.",
        },
      },
      { status: 502 },
    );
  }
}

async function readOptionalJson(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function normalizePayload(payload: unknown) {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data?: unknown }).data ?? null;
  }

  return payload;
}

function toAdminUrl(baseUrl: string, path: string) {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(path, base).toString();
}

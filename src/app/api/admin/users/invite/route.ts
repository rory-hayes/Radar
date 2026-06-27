import { NextResponse } from "next/server";

import { requireApiAuth } from "@/lib/auth/api";
import { can, getAdminContext } from "@/lib/admin-data";
import { ApiError } from "@/lib/sessions/http";
import { createWorkspaceInvite } from "@/lib/workspace/store";
import { InviteUserSchema } from "@/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let auth;
  try {
    auth = await requireApiAuth();
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
          code: "supabase_not_configured",
          message: "Connect workspace data before inviting users.",
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
    const invite = await createWorkspaceInvite({
      email: parsed.data.email,
      role: parsed.data.role,
      invitedByEmail: auth.email,
    });

    return NextResponse.json(
      {
        ok: true,
        invite,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "invite_failed",
          message: error instanceof Error ? error.message : "Radar could not send the invite.",
        },
      },
      { status: 502 },
    );
  }
}

import { NextResponse } from "next/server";

import { requireApiAuth } from "@/lib/auth/api";
import { can, getAdminContext } from "@/lib/admin-data";
import { createConnectorRequest } from "@/lib/connectors/store";
import { ApiError } from "@/lib/sessions/http";
import { ConnectorRequestSchema } from "@/schema";

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
  const parsed = ConnectorRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "invalid_request",
          message: "Enter connector details before requesting setup.",
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
          code: "workspace_not_configured",
          message: "Connect workspace data before requesting connector setup.",
          missing: context.missingConfig,
        },
      },
      { status: 503 },
    );
  }

  if (!can(context, "manageConnectors")) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "forbidden",
          message: "Your current role cannot request workspace connectors.",
        },
      },
      { status: 403 },
    );
  }

  try {
    const connectorRequest = await createConnectorRequest({
      connectorType: parsed.data.connectorType,
      displayName: parsed.data.displayName,
      sourceLocation: parsed.data.sourceLocation || undefined,
      note: parsed.data.note || undefined,
      requestedByEmail: auth.email,
      workspaceId: context.workspaceId,
    });

    return NextResponse.json(
      {
        ok: true,
        connectorRequest,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "connector_request_failed",
          message:
            error instanceof Error
              ? error.message
              : "Radar could not save the connector request.",
        },
      },
      { status: 502 },
    );
  }
}

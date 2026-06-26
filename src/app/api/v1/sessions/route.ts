import { createSession } from "@/lib/sessions/store";
import { json, jsonError, optionsResponse, readJson } from "@/lib/sessions/http";
import { createSessionRequestSchema } from "@/lib/sessions/validation";

export const runtime = "nodejs";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request, createSessionRequestSchema);
    const session = createSession({
      workspaceId: body.workspaceId,
      tab: body.tab,
      capture: body.capture,
      consent: body.consent,
      client: body.client,
    });

    return json(
      {
        ok: true,
        session,
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}

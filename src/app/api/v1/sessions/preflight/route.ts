import { realtimeServerState } from "@/lib/realtime/openai";
import { json, jsonError, optionsResponse, readJson } from "@/lib/sessions/http";
import { preflightRequestSchema } from "@/lib/sessions/validation";

export const runtime = "nodejs";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request, preflightRequestSchema);
    const realtime = realtimeServerState();

    return json({
      ok: true,
      state: realtime.configured ? "ready" : "not_configured",
      realtime: {
        configured: realtime.configured,
        model: realtime.model,
        clientSecretsEndpoint: realtime.clientSecretsEndpoint,
      },
      capture: {
        microphone: {
          requested: body.capture.microphone,
          available: true,
          requiresBrowserPrompt: body.capture.microphone,
        },
        activeTab: {
          requested: body.capture.activeTab,
          available: Boolean(body.tab?.url || body.tab?.title),
        },
      },
      requirements: [
        "Explicit user start is required before capture.",
        "A visible Radar indicator must remain present while capture is active.",
        "OpenAI API credentials are minted server-side only.",
      ],
      warnings: realtime.configured
        ? []
        : ["Server-side Realtime credentials are not configured, so live transcription credentials cannot be minted."],
    });
  } catch (error) {
    return jsonError(error);
  }
}

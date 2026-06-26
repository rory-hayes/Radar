import "server-only";

import {
  getOpenAIApiKey,
  hasConfiguredServerSecret,
} from "@/lib/security/server-secrets";

const REALTIME_CLIENT_SECRETS_URL = "https://api.openai.com/v1/realtime/client_secrets";
const DEFAULT_TRANSCRIPTION_MODEL = "gpt-realtime-whisper";
const DEFAULT_CLIENT_SECRET_TTL_SECONDS = 600;

export type RealtimeClientSecretResult =
  | {
      state: "not_configured";
      model: string;
      reason: "missing_openai_api_key";
    }
  | {
      state: "ready";
      model: string;
      expiresAt?: number;
      clientSecret: string;
      responseMeta: {
        expiresAt?: number;
      };
    };

export function realtimeServerState() {
  const model =
    process.env.OPENAI_REALTIME_MODEL?.trim() ||
    process.env.OPENAI_REALTIME_TRANSCRIPTION_MODEL?.trim() ||
    DEFAULT_TRANSCRIPTION_MODEL;
  return {
    configured: hasConfiguredServerSecret("OPENAI_API_KEY"),
    model,
    clientSecretsEndpoint: "/v1/realtime/client_secrets",
  };
}

export async function mintRealtimeClientSecret(): Promise<RealtimeClientSecretResult> {
  const model =
    process.env.OPENAI_REALTIME_MODEL?.trim() ||
    process.env.OPENAI_REALTIME_TRANSCRIPTION_MODEL?.trim() ||
    DEFAULT_TRANSCRIPTION_MODEL;
  const ttlSeconds = Number.parseInt(
    process.env.OPENAI_REALTIME_CLIENT_SECRET_TTL_SECONDS || `${DEFAULT_CLIENT_SECRET_TTL_SECONDS}`,
    10,
  );

  if (!hasConfiguredServerSecret("OPENAI_API_KEY")) {
    return {
      state: "not_configured",
      model,
      reason: "missing_openai_api_key",
    };
  }

  const apiKey = getOpenAIApiKey();
  const safetyIdentifier =
    process.env.OPENAI_SAFETY_IDENTIFIER?.trim() ||
    process.env.RADAR_OPENAI_SAFETY_IDENTIFIER?.trim();

  const response = await fetch(REALTIME_CLIENT_SECRETS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(safetyIdentifier ? { "OpenAI-Safety-Identifier": safetyIdentifier } : {}),
    },
    body: JSON.stringify({
      expires_after: {
        anchor: "created_at",
        seconds: Number.isNaN(ttlSeconds) ? DEFAULT_CLIENT_SECRET_TTL_SECONDS : ttlSeconds,
      },
      session: {
        type: "transcription",
        audio: {
          input: {
            format: {
              type: "audio/pcm",
              rate: 24000,
            },
            transcription: {
              model,
              language: "en",
              delay: "low",
            },
            turn_detection: null,
          },
        },
      },
    }),
  });

  const payload = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new Error(
      `OpenAI Realtime client secret request failed with ${response.status}: ${JSON.stringify(payload)}`,
    );
  }

  const clientSecretPayload =
    typeof payload === "object" && payload !== null && "client_secret" in payload
      ? payload.client_secret
      : payload;

  const expiresAt =
    typeof clientSecretPayload === "object" &&
    clientSecretPayload !== null &&
    "expires_at" in clientSecretPayload &&
    typeof clientSecretPayload.expires_at === "number"
      ? clientSecretPayload.expires_at
      : typeof payload === "object" &&
          payload !== null &&
          "expires_at" in payload &&
          typeof payload.expires_at === "number"
        ? payload.expires_at
        : undefined;

  const clientSecret =
    typeof clientSecretPayload === "object" && clientSecretPayload !== null && "value" in clientSecretPayload
      ? clientSecretPayload.value
      : clientSecretPayload;

  if (typeof clientSecret !== "string") {
    throw new Error("OpenAI Realtime client secret response did not include an ephemeral secret value.");
  }

  return {
    state: "ready",
    model,
    expiresAt,
    clientSecret,
    responseMeta: {
      expiresAt,
    },
  };
}

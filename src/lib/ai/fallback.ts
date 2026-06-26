import type { GuidanceCard, IntentLabel } from "@/lib/domain";

type NoEvidenceFallbackInput = {
  id: string;
  tenantId: string;
  sessionId: string;
  relatedTurnIds: string[];
  intent?: IntentLabel;
  highRisk?: boolean;
  createdAt: string;
};

function pickFallbackKind(
  input: NoEvidenceFallbackInput,
): GuidanceCard["kind"] {
  if (input.highRisk || input.intent === "legal" || input.intent === "security") {
    return "escalate";
  }

  if (input.intent === "unknown") {
    return "ask";
  }

  return "needs_confirmation";
}

export function buildNoEvidenceFallback(
  input: NoEvidenceFallbackInput,
): GuidanceCard {
  const kind = pickFallbackKind(input);
  const title =
    kind === "ask"
      ? "Ask a clarifying question"
      : kind === "escalate"
        ? "Escalate without cited evidence"
        : "Needs confirmation";

  return {
    id: input.id,
    tenantId: input.tenantId,
    sessionId: input.sessionId,
    kind,
    title,
    body:
      "Radar could not find approved, in-scope evidence for this turn. Do not answer as fact until a cited source is available.",
    claims: [
      {
        id: `${input.id}:claim:no-evidence`,
        text: "No approved retrieval evidence supported a factual answer for this turn.",
        supportStatus: "needs_confirmation",
        citationIds: [],
      },
    ],
    citations: [],
    relatedTurnIds: input.relatedTurnIds,
    priority: kind === "escalate" ? "high" : "normal",
    createdAt: input.createdAt,
  };
}

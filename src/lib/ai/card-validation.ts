import {
  GuidanceCardSchema,
  type GuidanceCard,
  type GuidanceCardKind,
} from "@/lib/domain";

export type CardValidationIssue = {
  path: string;
  message: string;
};

export type CardValidationResult =
  | {
      ok: true;
      card: GuidanceCard;
      issues: [];
    }
  | {
      ok: false;
      issues: CardValidationIssue[];
    };

const fallbackKinds = new Set<GuidanceCardKind>([
  "ask",
  "needs_confirmation",
  "escalate",
]);

export function cardKindRequiresCitations(kind: GuidanceCardKind): boolean {
  return kind === "answer" || kind === "proof";
}

export function validateGuidanceCard(input: unknown): CardValidationResult {
  const parsed = GuidanceCardSchema.safeParse(input);

  if (parsed.success) {
    return {
      ok: true,
      card: parsed.data,
      issues: [],
    };
  }

  return {
    ok: false,
    issues: parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
}

export function cardHasUnsupportedClaims(card: GuidanceCard): boolean {
  return card.claims.some((claim) => claim.supportStatus !== "supported");
}

export function downgradeUnsupportedCard(
  card: GuidanceCard,
  fallbackKind: Extract<
    GuidanceCardKind,
    "ask" | "needs_confirmation" | "escalate"
  > = "needs_confirmation",
): GuidanceCard {
  if (!fallbackKinds.has(fallbackKind)) {
    throw new Error("Unsupported claims can only downgrade to fallback cards");
  }

  if (
    !cardKindRequiresCitations(card.kind) ||
    (card.citations.length > 0 && !cardHasUnsupportedClaims(card))
  ) {
    return card;
  }

  return {
    ...card,
    kind: fallbackKind,
    title:
      fallbackKind === "ask"
        ? "Ask for confirmation"
        : fallbackKind === "escalate"
          ? "Escalate for confirmation"
          : "Needs confirmation",
    claims: card.claims.map((claim) => {
      const citationIds = claim.citationIds.filter((citationId) =>
        card.citations.some((citation) => citation.id === citationId),
      );

      return {
        ...claim,
        citationIds,
        supportStatus:
          citationIds.length > 0 && claim.supportStatus === "supported"
            ? claim.supportStatus
            : "needs_confirmation",
      };
    }),
  };
}

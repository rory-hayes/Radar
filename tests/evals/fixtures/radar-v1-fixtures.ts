import type {
  Citation,
  EventEnvelope,
  GuidanceCard,
  RetrievalEvidence,
  RetrievalRequest,
  SessionEnvelope,
  UntrustedEvidenceText,
} from "@/lib/domain";

export const EVAL_FIXTURE_WARNING =
  "NOT_PRODUCTION: synthetic Radar V1 eval fixture only";

export const FIXTURE_NOW = "2026-06-26T14:00:00.000Z";
export const FIXTURE_EXPIRY = "2026-07-26T14:00:00.000Z";

export function untrustedFixtureText(value: string): UntrustedEvidenceText {
  return {
    value,
    trust: "untrusted_evidence",
    instructionPolicy: "never_execute",
    mayContainInstructions: true,
  };
}

export function retrievalRequestFixture(): RetrievalRequest {
  return {
    id: "eval_request_001",
    tenantId: "tenant_eval_not_production",
    sessionId: "session_eval_not_production",
    turnId: "turn_eval_001",
    query: untrustedFixtureText("Does the eval product support EU rollout?"),
    preScoreFilters: {
      tenantId: "tenant_eval_not_production",
      requestingUserId: "user_eval_001",
      sourceStatuses: ["approved"],
      products: ["eval-product"],
      regions: ["eu"],
      audiences: ["sales", "support"],
      confidentialityLevels: ["public", "internal"],
      effective: {
        atOrBefore: FIXTURE_NOW,
      },
      expiry: {
        after: FIXTURE_NOW,
        includeMissingExpiry: true,
      },
    },
    scoring: {
      scorer: "keyword",
      limit: 5,
      minScore: 0.2,
    },
    createdAt: FIXTURE_NOW,
  };
}

export function evidenceFixture(
  overrides: Partial<RetrievalEvidence> = {},
): RetrievalEvidence {
  return {
    id: "evidence_eval_001",
    tenantId: "tenant_eval_not_production",
    sourceId: "source_eval_001",
    sourceStatus: "approved",
    sourceTitle: `${EVAL_FIXTURE_WARNING} source`,
    product: "eval-product",
    region: "eu",
    audiences: ["sales"],
    confidentiality: "internal",
    effectiveAt: "2026-01-01T00:00:00.000Z",
    expiresAt: FIXTURE_EXPIRY,
    locator: "section-1",
    access: {
      allowedUserIds: ["user_eval_001"],
    },
    chunk: untrustedFixtureText(
      "Eval product supports EU rollout with approved onboarding steps.",
    ),
    retrievedAt: FIXTURE_NOW,
    ...overrides,
  };
}

export function citationFixture(overrides: Partial<Citation> = {}): Citation {
  return {
    id: "citation_eval_001",
    evidenceId: "evidence_eval_001",
    sourceId: "source_eval_001",
    title: `${EVAL_FIXTURE_WARNING} citation`,
    locator: "section-1",
    quote: untrustedFixtureText("EU rollout is supported."),
    retrievedAt: FIXTURE_NOW,
    effectiveAt: "2026-01-01T00:00:00.000Z",
    expiresAt: FIXTURE_EXPIRY,
    ...overrides,
  };
}

export function guidanceCardFixture(
  overrides: Partial<GuidanceCard> = {},
): GuidanceCard {
  const citation = citationFixture();

  return {
    id: "card_eval_001",
    tenantId: "tenant_eval_not_production",
    sessionId: "session_eval_not_production",
    kind: "answer",
    title: "EU rollout guidance",
    body: "Use the cited onboarding steps for EU rollout.",
    claims: [
      {
        id: "claim_eval_001",
        text: "EU rollout is supported by the approved eval source.",
        supportStatus: "supported",
        citationIds: [citation.id],
      },
    ],
    citations: [citation],
    relatedTurnIds: ["turn_eval_001"],
    priority: "normal",
    createdAt: FIXTURE_NOW,
    ...overrides,
  };
}

export function sessionEnvelopeFixture(
  overrides: Partial<SessionEnvelope> = {},
): SessionEnvelope {
  return {
    id: "session_eval_not_production",
    tenantId: "tenant_eval_not_production",
    userId: "user_eval_001",
    status: "capturing",
    capture: {
      consentRecorded: true,
      visibleIndicator: true,
      rawAudioStored: false,
    },
    realtimeCredential: {
      scope: "session_channel",
      channelId: "channel_eval_001",
      expiresAt: FIXTURE_EXPIRY,
    },
    startedAt: FIXTURE_NOW,
    createdAt: FIXTURE_NOW,
    updatedAt: FIXTURE_NOW,
    ...overrides,
  };
}

export function eventEnvelopeFixture(
  overrides: Partial<EventEnvelope> = {},
): EventEnvelope {
  return {
    id: "event_eval_001",
    tenantId: "tenant_eval_not_production",
    sessionId: "session_eval_not_production",
    sequence: 1,
    kind: "session.started",
    actor: {
      type: "system",
    },
    payload: {
      fixture: EVAL_FIXTURE_WARNING,
    },
    schemaVersion: "radar.event.v1",
    confidentiality: "internal",
    occurredAt: FIXTURE_NOW,
    receivedAt: FIXTURE_NOW,
    ...overrides,
  };
}

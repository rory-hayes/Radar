import * as z from "zod";

const idPattern = /^[A-Za-z0-9._:-]+$/;

export const RadarIdSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(idPattern, "Use stable ASCII ids without whitespace");

export const IsoDateTimeSchema = z.string().datetime({ offset: true });

export const UntrustedEvidenceTextSchema = z.object({
  value: z.string().min(1),
  trust: z.literal("untrusted_evidence"),
  instructionPolicy: z.literal("never_execute"),
  mayContainInstructions: z.literal(true),
});

export const TranscriptSpeakerRoleSchema = z.enum([
  "customer",
  "seller",
  "support",
  "engineer",
  "system_observation",
  "unknown",
]);

export const TranscriptSegmentSchema = z
  .object({
    id: RadarIdSchema,
    tenantId: RadarIdSchema,
    sessionId: RadarIdSchema,
    source: z.enum([
      "browser_transcription",
      "manual_note",
      "imported_transcript",
    ]),
    speaker: z.object({
      id: RadarIdSchema.optional(),
      role: TranscriptSpeakerRoleSchema,
      displayName: z.string().max(120).optional(),
    }),
    startedAt: IsoDateTimeSchema,
    endedAt: IsoDateTimeSchema.optional(),
    language: z.string().min(2).max(16).optional(),
    confidence: z.number().min(0).max(1).optional(),
    text: UntrustedEvidenceTextSchema,
    createdAt: IsoDateTimeSchema,
  })
  .strict()
  .superRefine((segment, ctx) => {
    if (!segment.endedAt) {
      return;
    }

    if (Date.parse(segment.endedAt) < Date.parse(segment.startedAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endedAt"],
        message: "Segment end time must be at or after start time",
      });
    }
  });

export const TurnAssemblySchema = z
  .object({
    id: RadarIdSchema,
    tenantId: RadarIdSchema,
    sessionId: RadarIdSchema,
    turnIndex: z.number().int().nonnegative(),
    segmentIds: z.array(RadarIdSchema).nonempty(),
    speakerRole: TranscriptSpeakerRoleSchema,
    startedAt: IsoDateTimeSchema,
    endedAt: IsoDateTimeSchema,
    text: UntrustedEvidenceTextSchema,
    assemblyStrategy: z.enum([
      "semantic_pause",
      "speaker_change",
      "manual_review",
      "time_window",
    ]),
    createdAt: IsoDateTimeSchema,
  })
  .strict()
  .superRefine((turn, ctx) => {
    if (Date.parse(turn.endedAt) < Date.parse(turn.startedAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endedAt"],
        message: "Turn end time must be at or after start time",
      });
    }
  });

export const IntentLabelSchema = z.enum([
  "pricing",
  "security",
  "implementation",
  "troubleshooting",
  "integration",
  "competitive",
  "renewal",
  "legal",
  "unknown",
]);

export const EntityKindSchema = z.enum([
  "product",
  "feature",
  "competitor",
  "region",
  "account",
  "compliance",
  "integration",
  "date",
  "person",
  "unknown",
]);

export const ClassifiedEntitySchema = z
  .object({
    id: RadarIdSchema,
    kind: EntityKindSchema,
    label: z.string().min(1).max(200),
    normalizedValue: z.string().max(240).optional(),
    sourceTurnIds: z.array(RadarIdSchema).nonempty(),
    confidence: z.number().min(0).max(1),
  })
  .strict();

export const IntentEntityClassificationSchema = z
  .object({
    id: RadarIdSchema,
    tenantId: RadarIdSchema,
    sessionId: RadarIdSchema,
    turnId: RadarIdSchema,
    intent: z.object({
      label: IntentLabelSchema,
      confidence: z.number().min(0).max(1),
      rationale: z.string().max(500).optional(),
    }),
    entities: z.array(ClassifiedEntitySchema),
    sourceTurnIds: z.array(RadarIdSchema).nonempty(),
    classifier: z
      .object({
        provider: z.string().min(1).max(80),
        model: z.string().min(1).max(120),
        version: z.string().max(120).optional(),
      })
      .optional(),
    createdAt: IsoDateTimeSchema,
  })
  .strict();

export const SourceStatusSchema = z.enum([
  "approved",
  "review_required",
  "stale",
  "disabled",
  "deleted",
]);

export const AudienceSchema = z.enum([
  "sales",
  "support",
  "success",
  "engineering",
  "admin",
  "partner",
  "customer",
]);

export const ConfidentialitySchema = z.enum([
  "public",
  "internal",
  "confidential",
  "restricted",
]);

export const RetrievalPreScoreFiltersSchema = z
  .object({
    tenantId: RadarIdSchema,
    requestingUserId: RadarIdSchema,
    sourceStatuses: z.array(SourceStatusSchema).nonempty(),
    products: z.array(z.string().min(1)).nonempty(),
    regions: z.array(z.string().min(1)).nonempty(),
    audiences: z.array(AudienceSchema).nonempty(),
    confidentialityLevels: z.array(ConfidentialitySchema).nonempty(),
    effective: z.object({
      atOrBefore: IsoDateTimeSchema,
    }),
    expiry: z.object({
      after: IsoDateTimeSchema,
      includeMissingExpiry: z.boolean(),
    }),
  })
  .strict();

export const RetrievalScoringOptionsSchema = z
  .object({
    scorer: z.enum(["semantic", "hybrid", "keyword"]),
    limit: z.number().int().positive().max(50),
    minScore: z.number().min(0).max(1).optional(),
  })
  .strict();

export const RetrievalRequestSchema = z
  .object({
    id: RadarIdSchema,
    tenantId: RadarIdSchema,
    sessionId: RadarIdSchema,
    turnId: RadarIdSchema.optional(),
    query: UntrustedEvidenceTextSchema,
    preScoreFilters: RetrievalPreScoreFiltersSchema,
    scoring: RetrievalScoringOptionsSchema,
    createdAt: IsoDateTimeSchema,
  })
  .strict()
  .superRefine((request, ctx) => {
    if (request.tenantId !== request.preScoreFilters.tenantId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["preScoreFilters", "tenantId"],
        message: "Retrieval filters must be tenant scoped before scoring",
      });
    }
  });

export const RetrievalEvidenceSchema = z
  .object({
    id: RadarIdSchema,
    tenantId: RadarIdSchema,
    sourceId: RadarIdSchema,
    sourceStatus: SourceStatusSchema,
    sourceTitle: z.string().min(1).max(240),
    sourceUri: z.string().url().optional(),
    product: z.string().min(1).max(120),
    region: z.string().min(1).max(80),
    audiences: z.array(AudienceSchema).nonempty(),
    confidentiality: ConfidentialitySchema,
    effectiveAt: IsoDateTimeSchema,
    expiresAt: IsoDateTimeSchema.optional(),
    locator: z.string().max(240).optional(),
    access: z
      .object({
        allowedUserIds: z.array(RadarIdSchema).optional(),
        deniedUserIds: z.array(RadarIdSchema).optional(),
      })
      .strict()
      .optional(),
    chunk: UntrustedEvidenceTextSchema,
    retrievedAt: IsoDateTimeSchema,
    score: z.number().min(0).max(1).optional(),
  })
  .strict();

export const CitationSchema = z
  .object({
    id: RadarIdSchema,
    evidenceId: RadarIdSchema,
    sourceId: RadarIdSchema,
    title: z.string().min(1).max(240),
    locator: z.string().max(240).optional(),
    quote: UntrustedEvidenceTextSchema,
    retrievedAt: IsoDateTimeSchema,
    effectiveAt: IsoDateTimeSchema.optional(),
    expiresAt: IsoDateTimeSchema.optional(),
  })
  .strict();

export const ClaimSupportStatusSchema = z.enum([
  "supported",
  "needs_confirmation",
  "unsupported",
]);

export const GuidanceClaimSchema = z
  .object({
    id: RadarIdSchema,
    text: z.string().min(1).max(800),
    supportStatus: ClaimSupportStatusSchema,
    citationIds: z.array(RadarIdSchema),
  })
  .strict();

export const GuidanceCardKindSchema = z.enum([
  "answer",
  "proof",
  "ask",
  "needs_confirmation",
  "escalate",
]);

export const GuidanceCardSchema = z
  .object({
    id: RadarIdSchema,
    tenantId: RadarIdSchema,
    sessionId: RadarIdSchema,
    kind: GuidanceCardKindSchema,
    title: z.string().min(1).max(140),
    body: z.string().min(1).max(1600),
    claims: z.array(GuidanceClaimSchema),
    citations: z.array(CitationSchema),
    relatedTurnIds: z.array(RadarIdSchema),
    priority: z.enum(["low", "normal", "high"]),
    createdAt: IsoDateTimeSchema,
    expiresAt: IsoDateTimeSchema.optional(),
  })
  .strict()
  .superRefine((card, ctx) => {
    const citationIds = new Set(card.citations.map((citation) => citation.id));
    const requiresCitations = card.kind === "answer" || card.kind === "proof";

    if (requiresCitations && card.citations.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["citations"],
        message: "Answer and Proof cards require at least one citation",
      });
    }

    card.claims.forEach((claim, claimIndex) => {
      claim.citationIds.forEach((citationId, citationIndex) => {
        if (!citationIds.has(citationId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["claims", claimIndex, "citationIds", citationIndex],
            message: "Claim references a citation that is not on the card",
          });
        }
      });

      if (!requiresCitations) {
        return;
      }

      if (claim.supportStatus !== "supported") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["claims", claimIndex, "supportStatus"],
          message:
            "Unsupported Answer and Proof claims must be converted to Ask, Needs confirmation, or Escalate",
        });
      }

      if (claim.citationIds.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["claims", claimIndex, "citationIds"],
          message: "Answer and Proof claims require supporting citations",
        });
      }
    });
  });

export const FeedbackSchema = z
  .object({
    id: RadarIdSchema,
    tenantId: RadarIdSchema,
    sessionId: RadarIdSchema,
    cardId: RadarIdSchema,
    userId: RadarIdSchema,
    rating: z.enum(["helpful", "not_helpful", "unsafe", "stale", "wrong"]),
    note: z.string().max(1200).optional(),
    correction: z
      .object({
        text: z.string().min(1).max(1600),
        citationIds: z.array(RadarIdSchema),
      })
      .strict()
      .optional(),
    createdAt: IsoDateTimeSchema,
  })
  .strict();

export const SessionStatusSchema = z.enum([
  "created",
  "capturing",
  "paused",
  "ended",
  "failed",
]);

export const SessionEnvelopeSchema = z
  .object({
    id: RadarIdSchema,
    tenantId: RadarIdSchema,
    userId: RadarIdSchema,
    status: SessionStatusSchema,
    capture: z
      .object({
        consentRecorded: z.boolean(),
        visibleIndicator: z.boolean(),
        rawAudioStored: z.literal(false),
      })
      .strict(),
    realtimeCredential: z
      .object({
        scope: z.literal("session_channel"),
        channelId: RadarIdSchema,
        expiresAt: IsoDateTimeSchema,
      })
      .strict()
      .optional(),
    startedAt: IsoDateTimeSchema.optional(),
    endedAt: IsoDateTimeSchema.optional(),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
  })
  .strict()
  .superRefine((session, ctx) => {
    if (session.status === "capturing" && !session.capture.consentRecorded) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["capture", "consentRecorded"],
        message: "Capturing requires recorded consent",
      });
    }

    if (session.status === "capturing" && !session.capture.visibleIndicator) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["capture", "visibleIndicator"],
        message: "Capturing requires a visible indicator",
      });
    }

    if (session.endedAt && !["ended", "failed"].includes(session.status)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endedAt"],
        message: "Only ended or failed sessions may have endedAt",
      });
    }
  });

export const RadarEventKindSchema = z.enum([
  "session.created",
  "session.started",
  "session.paused",
  "session.ended",
  "transcript.segment.created",
  "turn.assembled",
  "intent.classified",
  "retrieval.completed",
  "guidance.card.created",
  "feedback.created",
]);

export const EventEnvelopeSchema = z
  .object({
    id: RadarIdSchema,
    tenantId: RadarIdSchema,
    sessionId: RadarIdSchema,
    sequence: z.number().int().nonnegative(),
    kind: RadarEventKindSchema,
    actor: z
      .object({
        type: z.enum(["user", "system", "model", "integration"]),
        id: RadarIdSchema.optional(),
      })
      .strict(),
    payload: z.unknown(),
    schemaVersion: z.literal("radar.event.v1"),
    confidentiality: ConfidentialitySchema,
    occurredAt: IsoDateTimeSchema,
    receivedAt: IsoDateTimeSchema,
  })
  .strict()
  .superRefine((event, ctx) => {
    if (Date.parse(event.receivedAt) < Date.parse(event.occurredAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["receivedAt"],
        message: "Event receivedAt must be at or after occurredAt",
      });
    }
  });

export type RadarId = z.infer<typeof RadarIdSchema>;
export type UntrustedEvidenceText = z.infer<typeof UntrustedEvidenceTextSchema>;
export type TranscriptSegment = z.infer<typeof TranscriptSegmentSchema>;
export type TurnAssembly = z.infer<typeof TurnAssemblySchema>;
export type IntentLabel = z.infer<typeof IntentLabelSchema>;
export type IntentEntityClassification = z.infer<
  typeof IntentEntityClassificationSchema
>;
export type SourceStatus = z.infer<typeof SourceStatusSchema>;
export type Audience = z.infer<typeof AudienceSchema>;
export type Confidentiality = z.infer<typeof ConfidentialitySchema>;
export type RetrievalPreScoreFilters = z.infer<
  typeof RetrievalPreScoreFiltersSchema
>;
export type RetrievalRequest = z.infer<typeof RetrievalRequestSchema>;
export type RetrievalEvidence = z.infer<typeof RetrievalEvidenceSchema>;
export type Citation = z.infer<typeof CitationSchema>;
export type GuidanceClaim = z.infer<typeof GuidanceClaimSchema>;
export type GuidanceCardKind = z.infer<typeof GuidanceCardKindSchema>;
export type GuidanceCard = z.infer<typeof GuidanceCardSchema>;
export type Feedback = z.infer<typeof FeedbackSchema>;
export type SessionEnvelope = z.infer<typeof SessionEnvelopeSchema>;
export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;

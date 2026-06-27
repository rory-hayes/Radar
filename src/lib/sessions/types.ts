export type CaptureSource = "microphone" | "active_tab" | "manual";

export type SessionStatus = "active" | "paused" | "ended";

export type GuidanceLane =
  | "answer"
  | "proof"
  | "ask"
  | "needs_confirmation"
  | "escalate";

export type FeedbackRating = "helpful" | "not_helpful" | "incorrect" | "unsafe";

export type TabContext = {
  url?: string;
  title?: string;
  favIconUrl?: string;
};

export type CaptureConfig = {
  microphone: boolean;
  activeTab: boolean;
};

export type SessionConsent = {
  confirmed: true;
  capturedAt?: string;
  policyVersion?: string;
};

export type RadarSession = {
  id: string;
  createdByEmail: string;
  workspaceId?: string;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
  endedAt?: string;
  tab?: TabContext;
  capture: CaptureConfig;
  consent: SessionConsent;
  client?: {
    extensionVersion?: string;
    timezone?: string;
  };
};

export type TranscriptSegment = {
  id: string;
  sessionId: string;
  text: string;
  source: CaptureSource;
  isFinal: boolean;
  startedAtMs?: number;
  endedAtMs?: number;
  createdAt: string;
};

export type GuidanceCitation = {
  segmentId?: string;
  source: "transcript" | "knowledge";
  title: string;
  quote?: string;
  url?: string;
};

export type GuidanceCard = {
  id: string;
  sessionId: string;
  lane: GuidanceLane;
  title: string;
  body: string;
  citations: GuidanceCitation[];
  createdAt: string;
  isLocalTest: boolean;
};

export type CardFeedback = {
  id: string;
  sessionId: string;
  cardId: string;
  rating: FeedbackRating;
  note?: string;
  createdAt: string;
};

export type SessionEvent =
  | {
      id: string;
      sessionId: string;
      sequence: number;
      type: "session.started" | "session.paused" | "session.resumed" | "session.ended";
      createdAt: string;
      payload: Pick<RadarSession, "id" | "status" | "createdAt" | "updatedAt" | "endedAt">;
    }
  | {
      id: string;
      sessionId: string;
      sequence: number;
      type: "segment.created";
      createdAt: string;
      payload: TranscriptSegment;
    }
  | {
      id: string;
      sessionId: string;
      sequence: number;
      type: "card.created";
      createdAt: string;
      payload: GuidanceCard;
    }
  | {
      id: string;
      sessionId: string;
      sequence: number;
      type: "feedback.created";
      createdAt: string;
      payload: CardFeedback;
    }
  | {
      id: string;
      sessionId: string;
      sequence: number;
      type: "realtime.client_secret.not_configured" | "realtime.client_secret.created";
      createdAt: string;
      payload: {
        state: "not_configured" | "ready";
        model: string;
        expiresAt?: number;
      };
    };

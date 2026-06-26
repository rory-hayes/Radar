import type {
  CardFeedback,
  GuidanceCard,
  GuidanceCitation,
  RadarSession,
  SessionEvent,
  SessionStatus,
  TranscriptSegment,
} from "./types";

type Store = {
  sessions: Map<string, RadarSession>;
  segments: Map<string, TranscriptSegment[]>;
  cards: Map<string, GuidanceCard>;
  feedback: Map<string, CardFeedback[]>;
  events: Map<string, SessionEvent[]>;
};

declare global {
  var __radarSessionStore: Store | undefined;
}

const store: Store =
  globalThis.__radarSessionStore ??
  (globalThis.__radarSessionStore = {
    sessions: new Map(),
    segments: new Map(),
    cards: new Map(),
    feedback: new Map(),
    events: new Map(),
  });

function now() {
  return new Date().toISOString();
}

function nextSequence(sessionId: string) {
  return (store.events.get(sessionId)?.at(-1)?.sequence ?? 0) + 1;
}

function appendEvent(event: Omit<SessionEvent, "id" | "sequence" | "createdAt">) {
  const createdAt = now();
  const fullEvent = {
    ...event,
    id: crypto.randomUUID(),
    sequence: nextSequence(event.sessionId),
    createdAt,
  } as SessionEvent;

  const events = store.events.get(event.sessionId) ?? [];
  events.push(fullEvent);
  store.events.set(event.sessionId, events);
  return fullEvent;
}

function publicSessionPayload(session: RadarSession) {
  return {
    id: session.id,
    status: session.status,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    endedAt: session.endedAt,
  };
}

export function createSession(input: Omit<RadarSession, "id" | "status" | "createdAt" | "updatedAt">) {
  const createdAt = now();
  const session: RadarSession = {
    ...input,
    id: crypto.randomUUID(),
    status: "active",
    createdAt,
    updatedAt: createdAt,
  };

  store.sessions.set(session.id, session);
  store.segments.set(session.id, []);
  store.feedback.set(session.id, []);
  store.events.set(session.id, []);
  appendEvent({
    sessionId: session.id,
    type: "session.started",
    payload: publicSessionPayload(session),
  });

  return session;
}

export function getSession(sessionId: string) {
  return store.sessions.get(sessionId);
}

export function setSessionStatus(sessionId: string, status: SessionStatus) {
  const session = store.sessions.get(sessionId);
  if (!session) {
    return undefined;
  }

  const updatedAt = now();
  const nextSession: RadarSession = {
    ...session,
    status,
    updatedAt,
    endedAt: status === "ended" ? updatedAt : session.endedAt,
  };

  store.sessions.set(sessionId, nextSession);
  appendEvent({
    sessionId,
    type: status === "paused" ? "session.paused" : status === "ended" ? "session.ended" : "session.resumed",
    payload: publicSessionPayload(nextSession),
  });

  return nextSession;
}

export function addSegment(input: Omit<TranscriptSegment, "id" | "createdAt">) {
  const segment: TranscriptSegment = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now(),
  };

  const segments = store.segments.get(input.sessionId) ?? [];
  segments.push(segment);
  store.segments.set(input.sessionId, segments);
  appendEvent({
    sessionId: input.sessionId,
    type: "segment.created",
    payload: segment,
  });

  return segment;
}

export function addCard(card: Omit<GuidanceCard, "id" | "createdAt">) {
  if ((card.lane === "answer" || card.lane === "proof") && card.citations.length === 0) {
    throw new Error("Answer and Proof cards require citations.");
  }

  const guidanceCard: GuidanceCard = {
    ...card,
    id: crypto.randomUUID(),
    createdAt: now(),
  };

  store.cards.set(guidanceCard.id, guidanceCard);
  appendEvent({
    sessionId: guidanceCard.sessionId,
    type: "card.created",
    payload: guidanceCard,
  });

  return guidanceCard;
}

export function addFeedback(input: Omit<CardFeedback, "id" | "createdAt">) {
  const card = store.cards.get(input.cardId);
  if (!card || card.sessionId !== input.sessionId) {
    return undefined;
  }

  const feedback: CardFeedback = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now(),
  };

  const feedbackRows = store.feedback.get(input.sessionId) ?? [];
  feedbackRows.push(feedback);
  store.feedback.set(input.sessionId, feedbackRows);
  appendEvent({
    sessionId: input.sessionId,
    type: "feedback.created",
    payload: feedback,
  });

  return feedback;
}

export function addRealtimeEvent(
  sessionId: string,
  payload: Extract<
    SessionEvent,
    { type: "realtime.client_secret.created" | "realtime.client_secret.not_configured" }
  >["payload"],
) {
  return appendEvent({
    sessionId,
    type: payload.state === "ready" ? "realtime.client_secret.created" : "realtime.client_secret.not_configured",
    payload,
  });
}

export function listEvents(sessionId: string, afterSequence = 0) {
  return (store.events.get(sessionId) ?? []).filter((event) => event.sequence > afterSequence);
}

export function createLocalTestCard(segment: TranscriptSegment) {
  const citations: GuidanceCitation[] = [
    {
      segmentId: segment.id,
      source: "transcript",
      title: "Current transcript segment",
      quote: segment.text.slice(0, 240),
    },
  ];

  return addCard({
    sessionId: segment.sessionId,
    lane: "needs_confirmation",
    title: "Local deterministic helper",
    body: "This card was generated only because local test helpers are enabled for this environment.",
    citations,
    isLocalTest: true,
  });
}

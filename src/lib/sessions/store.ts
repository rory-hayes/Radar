import "server-only";

import { getDefaultWorkspaceId, getSupabaseAdminClient } from "@/lib/supabase/server";

import type {
  CardFeedback,
  GuidanceCard,
  GuidanceCitation,
  RadarSession,
  SessionEvent,
  SessionStatus,
  TranscriptSegment,
} from "./types";

type SessionRow = {
  id: string;
  workspace_id: string;
  created_by_email: string;
  status: SessionStatus;
  tab: RadarSession["tab"] | null;
  capture: RadarSession["capture"];
  consent: RadarSession["consent"];
  client: RadarSession["client"] | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

type SegmentRow = {
  id: string;
  session_id: string;
  text: string;
  source: TranscriptSegment["source"];
  is_final: boolean;
  started_at_ms: number | null;
  ended_at_ms: number | null;
  created_at: string;
};

type CardRow = {
  id: string;
  session_id: string;
  lane: GuidanceCard["lane"];
  title: string;
  body: string;
  citations: GuidanceCitation[];
  is_local_test: boolean;
  created_at: string;
};

type FeedbackRow = {
  id: string;
  session_id: string;
  card_id: string;
  rating: CardFeedback["rating"];
  note: string | null;
  created_at: string;
};

type EventRow = {
  id: string;
  session_id: string;
  sequence: number;
  type: SessionEvent["type"];
  payload: SessionEvent["payload"];
  created_at: string;
};

function publicSessionPayload(session: RadarSession) {
  return {
    id: session.id,
    status: session.status,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    endedAt: session.endedAt,
  };
}

function toSession(row: SessionRow): RadarSession {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdByEmail: row.created_by_email,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    endedAt: row.ended_at ?? undefined,
    tab: row.tab ?? undefined,
    capture: row.capture,
    consent: row.consent,
    client: row.client ?? undefined,
  };
}

function toSegment(row: SegmentRow): TranscriptSegment {
  return {
    id: row.id,
    sessionId: row.session_id,
    text: row.text,
    source: row.source,
    isFinal: row.is_final,
    startedAtMs: row.started_at_ms ?? undefined,
    endedAtMs: row.ended_at_ms ?? undefined,
    createdAt: row.created_at,
  };
}

function toCard(row: CardRow): GuidanceCard {
  return {
    id: row.id,
    sessionId: row.session_id,
    lane: row.lane,
    title: row.title,
    body: row.body,
    citations: row.citations,
    createdAt: row.created_at,
    isLocalTest: row.is_local_test,
  };
}

function toFeedback(row: FeedbackRow): CardFeedback {
  return {
    id: row.id,
    sessionId: row.session_id,
    cardId: row.card_id,
    rating: row.rating,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  };
}

function toEvent(row: EventRow): SessionEvent {
  return {
    id: row.id,
    sessionId: row.session_id,
    sequence: row.sequence,
    type: row.type,
    createdAt: row.created_at,
    payload: row.payload,
  } as SessionEvent;
}

async function ensureWorkspace(workspaceId: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("radar_workspaces")
    .upsert(
      {
        id: workspaceId,
        name: workspaceId === "radar" ? "Radar" : workspaceId,
      },
      { onConflict: "id" },
    );

  if (error) {
    throw error;
  }
}

async function nextSequence(sessionId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("radar_session_events")
    .select("sequence")
    .eq("session_id", sessionId)
    .order("sequence", { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  return ((data?.[0] as { sequence?: number } | undefined)?.sequence ?? 0) + 1;
}

async function appendEvent(event: Omit<SessionEvent, "id" | "sequence" | "createdAt">) {
  const supabase = getSupabaseAdminClient();
  const sequence = await nextSequence(event.sessionId);
  const { data, error } = await supabase
    .from("radar_session_events")
    .insert({
      session_id: event.sessionId,
      sequence,
      type: event.type,
      payload: event.payload,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return toEvent(data as EventRow);
}

export async function createSession(input: Omit<RadarSession, "id" | "status" | "createdAt" | "updatedAt">) {
  const supabase = getSupabaseAdminClient();
  const workspaceId = input.workspaceId ?? getDefaultWorkspaceId();
  await ensureWorkspace(workspaceId);

  const { data, error } = await supabase
    .from("radar_sessions")
    .insert({
      workspace_id: workspaceId,
      created_by_email: input.createdByEmail,
      status: "active",
      tab: input.tab ?? null,
      capture: input.capture,
      consent: input.consent,
      client: input.client ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const session = toSession(data as SessionRow);
  await appendEvent({
    sessionId: session.id,
    type: "session.started",
    payload: publicSessionPayload(session),
  });

  return session;
}

export async function getSession(sessionId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("radar_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toSession(data as SessionRow) : undefined;
}

export async function setSessionStatus(sessionId: string, status: SessionStatus) {
  const supabase = getSupabaseAdminClient();
  const updates = {
    status,
    updated_at: new Date().toISOString(),
    ...(status === "ended" ? { ended_at: new Date().toISOString() } : {}),
  };

  const { data, error } = await supabase
    .from("radar_sessions")
    .update(updates)
    .eq("id", sessionId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return undefined;
  }

  const session = toSession(data as SessionRow);
  await appendEvent({
    sessionId,
    type: status === "paused" ? "session.paused" : status === "ended" ? "session.ended" : "session.resumed",
    payload: publicSessionPayload(session),
  });

  return session;
}

export async function addSegment(input: Omit<TranscriptSegment, "id" | "createdAt">) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("radar_transcript_segments")
    .insert({
      session_id: input.sessionId,
      text: input.text,
      source: input.source,
      is_final: input.isFinal,
      started_at_ms: input.startedAtMs ?? null,
      ended_at_ms: input.endedAtMs ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const segment = toSegment(data as SegmentRow);
  await appendEvent({
    sessionId: input.sessionId,
    type: "segment.created",
    payload: segment,
  });

  return segment;
}

export async function addCard(card: Omit<GuidanceCard, "id" | "createdAt">) {
  if ((card.lane === "answer" || card.lane === "proof") && card.citations.length === 0) {
    throw new Error("Answer and Proof cards require citations.");
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("radar_guidance_cards")
    .insert({
      session_id: card.sessionId,
      lane: card.lane,
      title: card.title,
      body: card.body,
      citations: card.citations,
      is_local_test: card.isLocalTest,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const guidanceCard = toCard(data as CardRow);
  await appendEvent({
    sessionId: guidanceCard.sessionId,
    type: "card.created",
    payload: guidanceCard,
  });

  return guidanceCard;
}

export async function addFeedback(input: Omit<CardFeedback, "id" | "createdAt">) {
  const supabase = getSupabaseAdminClient();
  const { data: card, error: cardError } = await supabase
    .from("radar_guidance_cards")
    .select("id,session_id")
    .eq("id", input.cardId)
    .eq("session_id", input.sessionId)
    .maybeSingle();

  if (cardError) {
    throw cardError;
  }

  if (!card) {
    return undefined;
  }

  const { data, error } = await supabase
    .from("radar_card_feedback")
    .insert({
      session_id: input.sessionId,
      card_id: input.cardId,
      rating: input.rating,
      note: input.note ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const feedback = toFeedback(data as FeedbackRow);
  await appendEvent({
    sessionId: input.sessionId,
    type: "feedback.created",
    payload: feedback,
  });

  return feedback;
}

export async function addRealtimeEvent(
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

export async function listEvents(sessionId: string, afterSequence = 0) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("radar_session_events")
    .select("*")
    .eq("session_id", sessionId)
    .gt("sequence", afterSequence)
    .order("sequence", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as EventRow[]).map(toEvent);
}

export async function createLocalTestCard(segment: TranscriptSegment) {
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

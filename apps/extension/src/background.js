const DEFAULT_API_BASE = "https://radar-eight-nu.vercel.app";
const LEGACY_LOCAL_API_BASE = "http://localhost:3000";
const STATE_KEY = "radar.v1.state";

const initialState = {
  status: "idle",
  apiBase: DEFAULT_API_BASE,
  sessionId: null,
  cursor: 0,
  activeTab: null,
  capture: {
    microphone: false,
    activeTab: true
  },
  preflight: null,
  realtime: null,
  transcription: {
    state: "idle",
    source: null,
    partial: "",
    lastFinal: "",
    error: null,
    updatedAt: null
  },
  lastEndedSession: null,
  lastCard: null,
  lastError: null,
  updatedAt: null
};

let radarState = { ...initialState };
let pollingTimer = null;

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get(STATE_KEY);
  if (!stored[STATE_KEY]) {
    await persistState(initialState);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await hydrateState();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then((response) => sendResponse(response))
    .catch(async (error) => {
      await setState({
        status: "error",
        lastError: error instanceof Error ? error.message : "Radar extension request failed."
      });
      sendResponse({ ok: false, error: radarState.lastError, state: radarState });
    });

  return true;
});

async function handleMessage(message, sender) {
  await hydrateState();

  switch (message?.type) {
    case "RADAR_GET_STATE":
      return { ok: true, state: radarState };
    case "RADAR_SET_API_BASE":
      await setState({ apiBase: cleanApiBase(message.apiBase) });
      return { ok: true, state: radarState };
    case "RADAR_PREFLIGHT":
      return preflight(message);
    case "RADAR_START":
      return startSession(message);
    case "RADAR_PAUSE":
      return pauseSession();
    case "RADAR_RESUME":
      return resumeSession();
    case "RADAR_END":
      return endSession(message?.reason || "user_ended");
    case "RADAR_SEGMENT":
      return appendSegment(message);
    case "RADAR_CONTENT_ACTION":
      return handleContentAction(message.action);
    case "RADAR_OFFSCREEN_TRANSCRIPTION_STATE":
      return updateTranscription(message.transcription);
    case "RADAR_OFFSCREEN_TRANSCRIPT_DELTA":
      return handleTranscriptDelta(message);
    case "RADAR_OFFSCREEN_TRANSCRIPT_COMPLETED":
      return handleTranscriptCompleted(message);
    case "RADAR_OFFSCREEN_ERROR":
      return handleOffscreenError(message);
    default:
      return { ok: false, error: "Unknown Radar extension message." };
  }
}

async function preflight(message) {
  const activeTab = await getActiveTab();
  const capture = normalizeCapture(message.capture);
  const response = await postJson("/v1/sessions/preflight", {
    tab: toTabContext(activeTab),
    capture,
    client: clientContext()
  });

  await setState({
    status: response.state === "ready" ? "preflight_ready" : "not_configured",
    activeTab: toTabContext(activeTab),
    capture,
    preflight: response,
    realtime: response.realtime,
    transcription: transcriptionState("idle", {
      source: capture.microphone ? "microphone" : null
    }),
    lastError: null
  });
  await broadcastState();

  return { ok: true, state: radarState, preflight: response };
}

async function startSession(message) {
  const activeTab = await getActiveTab();
  const capture = normalizeCapture(message.capture);

  if (capture.microphone && message.microphoneProbe?.ok === false) {
    await setState({ status: "error", lastError: message.microphoneProbe.error });
    return { ok: false, error: message.microphoneProbe.error, state: radarState };
  }

  const sessionResponse = await postJson("/v1/sessions", {
    tab: toTabContext(activeTab),
    capture,
    consent: {
      confirmed: true,
      capturedAt: new Date().toISOString(),
      policyVersion: "radar-v1-extension"
    },
    client: clientContext()
  });

  const sessionId = sessionResponse.session.id;
  await setState({
    status: "active",
    sessionId,
    cursor: 0,
    activeTab: toTabContext(activeTab),
    capture,
    lastEndedSession: null,
    lastCard: null,
    lastError: null
  });

  const realtime = await connectRealtimeForSession(sessionId, capture);
  await broadcastState();
  startPolling();

  return {
    ok: true,
    state: radarState,
    session: sessionResponse.session,
    realtime: realtime.safeRealtime,
    capturePlan: buildCapturePlan(capture, realtime)
  };
}

async function pauseSession() {
  if (radarState.status !== "active") {
    return { ok: true, state: radarState };
  }

  await stopRealtimeTranscription("paused");
  await setState({
    status: "paused",
    transcription: transcriptionState("paused", {
      source: radarState.capture?.microphone ? "microphone" : null,
      lastFinal: radarState.transcription?.lastFinal || ""
    }),
    lastError: null
  });
  await broadcastState();
  return { ok: true, state: radarState };
}

async function resumeSession() {
  if (radarState.status !== "paused") {
    return { ok: true, state: radarState };
  }

  await setState({ status: "active", lastError: null });
  if (radarState.sessionId) {
    await connectRealtimeForSession(radarState.sessionId, radarState.capture);
  }
  await broadcastState();
  startPolling();
  return { ok: true, state: radarState };
}

async function endSession(reason) {
  stopPolling();
  await stopRealtimeTranscription("ended");

  let endedSession = null;
  if (radarState.sessionId) {
    const response = await postJson(`/v1/sessions/${radarState.sessionId}/end`, { reason });
    endedSession = response.session || null;
  }

  await setState({
    status: "ended",
    sessionId: null,
    cursor: 0,
    realtime: null,
    lastEndedSession: endedSession
      ? {
          id: endedSession.id,
          status: endedSession.status,
          endedAt: endedSession.endedAt,
          reviewUrl: `${radarState.apiBase}/app/sessions/${encodeURIComponent(endedSession.id)}`
        }
      : radarState.lastEndedSession,
    transcription: transcriptionState("ended", {
      source: radarState.capture?.microphone ? "microphone" : null,
      lastFinal: radarState.transcription?.lastFinal || ""
    }),
    lastError: null
  });
  await broadcastState();

  return { ok: true, state: radarState };
}

async function appendSegment(message) {
  if (!radarState.sessionId) {
    return { ok: false, error: "No active Radar session." };
  }

  const response = await postJson(`/v1/sessions/${radarState.sessionId}/segments`, {
    text: message.text,
    source: message.source || "manual",
    isFinal: message.isFinal !== false
  });

  return { ok: true, response };
}

async function handleContentAction(action) {
  if (action === "pause") {
    return pauseSession();
  }
  if (action === "resume") {
    return resumeSession();
  }
  if (action === "end") {
    return endSession("user_ended");
  }
  return { ok: false, error: "Unknown Radar drawer action." };
}

async function pollEvents() {
  if (!radarState.sessionId || radarState.status !== "active") {
    return;
  }

  const response = await getJson(`/v1/sessions/${radarState.sessionId}/events?after=${radarState.cursor || 0}`);
  const cardEvent = [...response.events].reverse().find((event) => event.type === "card.created");
  await setState({
    cursor: response.cursor,
    lastCard: cardEvent?.payload || radarState.lastCard,
    lastError: null
  });
  await broadcastState();
}

function startPolling() {
  stopPolling();
  pollingTimer = setInterval(() => {
    pollEvents().catch(async (error) => {
      await setState({
        lastError: error instanceof Error ? error.message : "Radar event polling failed."
      });
      await broadcastState();
    });
  }, 2500);
}

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

async function connectRealtimeForSession(sessionId, capture) {
  const realtimeResponse = await postJson(`/v1/sessions/${sessionId}/client-secrets`, {});
  const safeRealtime = toSafeRealtime(realtimeResponse);
  await setState({ realtime: safeRealtime });

  if (!capture.microphone) {
    await setState({
      transcription: transcriptionState("not_requested", {
        source: null
      })
    });
    return { response: realtimeResponse, safeRealtime, offscreen: "not_requested" };
  }

  if (realtimeResponse.state !== "ready" || !realtimeResponse.realtime?.clientSecret) {
    await setState({
      transcription: transcriptionState("not_configured", {
        source: "microphone",
        error: realtimeResponse.realtime?.reason || "Realtime client secret is not available."
      })
    });
    return { response: realtimeResponse, safeRealtime, offscreen: "not_configured" };
  }

  await ensureOffscreenDocument();
  await setState({
    transcription: transcriptionState("connecting", {
      source: "microphone"
    })
  });

  await chrome.runtime.sendMessage({
    type: "RADAR_OFFSCREEN_START",
    sessionId,
    apiBase: radarState.apiBase,
    clientSecret: realtimeResponse.realtime.clientSecret,
    model: realtimeResponse.realtime.model || safeRealtime.model
  });

  return { response: realtimeResponse, safeRealtime, offscreen: "connecting" };
}

async function ensureOffscreenDocument() {
  if (!chrome.offscreen?.createDocument) {
    throw new Error("Chrome offscreen documents are not available in this browser.");
  }

  if (chrome.offscreen.hasDocument && (await chrome.offscreen.hasDocument())) {
    return;
  }

  try {
    await chrome.offscreen.createDocument({
      url: "src/offscreen.html",
      reasons: ["USER_MEDIA"],
      justification: "Radar streams microphone audio to OpenAI Realtime using a short-lived server-minted client secret."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("Only a single offscreen document")) {
      throw error;
    }
  }
}

async function stopRealtimeTranscription(reason) {
  if (!chrome.offscreen?.hasDocument || !(await chrome.offscreen.hasDocument())) {
    return;
  }

  await chrome.runtime
    .sendMessage({
      type: "RADAR_OFFSCREEN_STOP",
      reason
    })
    .catch(() => undefined);
}

async function updateTranscription(transcription) {
  await setState({
    transcription: {
      ...(radarState.transcription || initialState.transcription),
      ...transcription,
      updatedAt: new Date().toISOString()
    },
    lastError: null
  });
  await broadcastState();
  return { ok: true, state: radarState };
}

async function handleTranscriptDelta(message) {
  await setState({
    transcription: transcriptionState("connected", {
      source: "microphone",
      partial: String(message.delta || ""),
      lastFinal: radarState.transcription?.lastFinal || ""
    }),
    lastError: null
  });
  await broadcastState();
  return { ok: true, state: radarState };
}

async function handleTranscriptCompleted(message) {
  const transcript = String(message.transcript || "").trim();
  if (!transcript) {
    return { ok: true, state: radarState };
  }

  if (radarState.sessionId && radarState.status === "active") {
    await postJson(`/v1/sessions/${radarState.sessionId}/segments`, {
      text: transcript,
      source: "microphone",
      isFinal: true,
      startedAtMs: normalizeMs(message.startedAtMs),
      endedAtMs: normalizeMs(message.endedAtMs)
    });
  }

  await setState({
    transcription: transcriptionState("connected", {
      source: "microphone",
      partial: "",
      lastFinal: transcript
    }),
    lastError: null
  });
  await broadcastState();
  return { ok: true, state: radarState };
}

async function handleOffscreenError(message) {
  const error = String(message.error || "Realtime transcription failed.");
  await setState({
    status: "error",
    transcription: transcriptionState("error", {
      source: "microphone",
      error,
      lastFinal: radarState.transcription?.lastFinal || ""
    }),
    lastError: error
  });
  await broadcastState();
  return { ok: true, state: radarState };
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function toTabContext(tab) {
  if (!tab) {
    return undefined;
  }

  return {
    url: tab.url,
    title: tab.title,
    favIconUrl: tab.favIconUrl
  };
}

function normalizeCapture(capture = {}) {
  return {
    microphone: Boolean(capture.microphone),
    activeTab: capture.activeTab !== false
  };
}

function buildCapturePlan(capture, realtime) {
  return {
    microphone: {
      requested: capture.microphone,
      realtime: realtime.offscreen,
      transport: capture.microphone ? "offscreen_webrtc" : "none"
    },
    activeTab: {
      requested: capture.activeTab,
      metadataReady: Boolean(radarState.activeTab?.url || radarState.activeTab?.title),
      tabAudioStreamIdReady: false,
      nextStep: capture.activeTab
        ? "Wire chrome.tabCapture.getMediaStreamId to an offscreen document before streaming tab audio."
        : "Not requested."
    }
  };
}

async function postJson(path, body) {
  return requestJson(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function getJson(path) {
  return requestJson(path, { method: "GET" });
}

async function requestJson(path, init) {
  const response = await fetch(`${radarState.apiBase}${path}`, {
    ...init,
    credentials: "include"
  });
  const payload = await response.json().catch(() => undefined);

  if (!response.ok || payload?.ok === false) {
    const message =
      payload?.error?.message ||
      (response.status === 401
        ? "Sign in to Radar in this browser, then try the extension again."
        : `Radar API request failed with ${response.status}.`);
    throw new Error(message);
  }

  return payload;
}

async function hydrateState() {
  const stored = await chrome.storage.local.get(STATE_KEY);
  radarState = {
    ...initialState,
    ...(stored[STATE_KEY] || {})
  };

  if (radarState.status === "idle" && radarState.apiBase === LEGACY_LOCAL_API_BASE) {
    radarState.apiBase = DEFAULT_API_BASE;
    await persistState(radarState);
  }
}

async function setState(patch) {
  radarState = {
    ...radarState,
    ...patch,
    updatedAt: new Date().toISOString()
  };
  await persistState(radarState);
}

async function persistState(state) {
  await chrome.storage.local.set({ [STATE_KEY]: state });
}

async function broadcastState() {
  const tabs = await chrome.tabs.query({});
  await Promise.allSettled(
    tabs.map((tab) =>
      tab.id
        ? chrome.tabs.sendMessage(tab.id, { type: "RADAR_RENDER_STATE", state: radarState })
        : Promise.resolve()
    )
  );
}

function cleanApiBase(apiBase) {
  const value = String(apiBase || DEFAULT_API_BASE).trim().replace(/\/$/, "");
  return value || DEFAULT_API_BASE;
}

function clientContext() {
  return {
    extensionVersion: chrome.runtime.getManifest().version,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}

function toSafeRealtime(response) {
  if (response?.state !== "ready") {
    return {
      state: response?.state || "unknown",
      model: response?.realtime?.model,
      reason: response?.realtime?.reason
    };
  }

  return {
    state: "ready",
    model: response.realtime?.model,
    expiresAt: response.realtime?.expiresAt
  };
}

function transcriptionState(state, patch = {}) {
  return {
    state,
    source: patch.source ?? radarState.transcription?.source ?? null,
    partial: patch.partial ?? "",
    lastFinal: patch.lastFinal ?? radarState.transcription?.lastFinal ?? "",
    error: patch.error ?? null,
    updatedAt: new Date().toISOString()
  };
}

function normalizeMs(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.round(value) : undefined;
}

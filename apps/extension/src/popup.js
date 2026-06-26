const apiBaseInput = document.querySelector("#apiBase");
const activeTabInput = document.querySelector("#activeTab");
const microphoneInput = document.querySelector("#microphone");
const notice = document.querySelector("#notice");
const statusPill = document.querySelector("#statusPill");
const sessionId = document.querySelector("#sessionId");
const realtimeState = document.querySelector("#realtimeState");
const transcriptionState = document.querySelector("#transcriptionState");
const cardState = document.querySelector("#cardState");

const controls = {
  preflight: document.querySelector("#preflight"),
  start: document.querySelector("#start"),
  pause: document.querySelector("#pause"),
  resume: document.querySelector("#resume"),
  end: document.querySelector("#end")
};

document.addEventListener("DOMContentLoaded", refresh);
apiBaseInput.addEventListener("change", saveApiBase);
controls.preflight.addEventListener("click", () => runAction("RADAR_PREFLIGHT"));
controls.start.addEventListener("click", () => runAction("RADAR_START"));
controls.pause.addEventListener("click", () => runAction("RADAR_PAUSE"));
controls.resume.addEventListener("click", () => runAction("RADAR_RESUME"));
controls.end.addEventListener("click", () => runAction("RADAR_END"));

async function refresh() {
  const response = await send({ type: "RADAR_GET_STATE" });
  render(response.state);
}

async function saveApiBase() {
  const response = await send({
    type: "RADAR_SET_API_BASE",
    apiBase: apiBaseInput.value
  });
  render(response.state);
}

async function runAction(type) {
  setBusy(true);
  let nextState;

  try {
    await saveApiBase();
    const capture = {
      activeTab: activeTabInput.checked,
      microphone: microphoneInput.checked
    };
    const response = await send({
      type,
      capture
    });

    nextState = response.state;
  } catch (error) {
    notice.classList.add("error");
    notice.textContent = error instanceof Error ? error.message : "Radar extension action failed.";
  } finally {
    setBusy(false);
    if (nextState) {
      render(nextState);
    }
  }
}

function render(state) {
  apiBaseInput.value = state.apiBase || "http://localhost:3000";
  activeTabInput.checked = state.capture?.activeTab !== false;
  microphoneInput.checked = Boolean(state.capture?.microphone);

  statusPill.textContent = labelForStatus(state.status);
  sessionId.textContent = state.sessionId || "None";
  realtimeState.textContent = realtimeLabel(state.realtime);
  transcriptionState.textContent = transcriptionLabel(state.transcription);
  cardState.textContent = state.lastCard?.title || "No card";

  notice.classList.toggle("error", state.status === "error");
  notice.classList.toggle("ready", state.status === "active" || state.status === "preflight_ready");
  notice.textContent = noticeText(state);

  controls.start.disabled = state.status === "active";
  controls.pause.disabled = state.status !== "active";
  controls.resume.disabled = state.status !== "paused";
  controls.end.disabled = !["active", "paused", "error"].includes(state.status);
}

function noticeText(state) {
  if (state.lastError) {
    return state.lastError;
  }
  if (state.status === "not_configured") {
    return "Radar server is reachable, but server-side Realtime credentials are not configured. Capture can be started for UI flow checks, but live Realtime credentials will not be available.";
  }
  if (state.status === "active") {
    if (state.transcription?.state === "connected") {
      return "Radar is actively streaming microphone audio to Realtime transcription with a short-lived server-minted credential.";
    }
    if (state.transcription?.state === "not_configured") {
      return "Radar is active, but Realtime transcription is not configured on the server.";
    }
    return "Radar is active. A visible indicator is shown on matching tabs.";
  }
  if (state.status === "paused") {
    return "Radar is paused locally. Resume or end the session from the popup or drawer.";
  }
  return "Start Radar only after the call participant consent and workspace policy checks are complete.";
}

function labelForStatus(status) {
  return String(status || "idle")
    .replaceAll("_", " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function realtimeLabel(realtime) {
  if (!realtime) {
    return "Unknown";
  }
  if (realtime.state === "not_configured" || realtime.configured === false) {
    return "Not configured";
  }
  if (realtime.state === "ready" || realtime.configured === true) {
    return realtime.model || "Ready";
  }
  return "Unknown";
}

function transcriptionLabel(transcription) {
  if (!transcription) {
    return "Idle";
  }

  const label = labelForStatus(transcription.state || "idle");
  if (transcription.partial) {
    return `${label}: ${transcription.partial}`;
  }
  if (transcription.lastFinal) {
    return `${label}: ${transcription.lastFinal}`;
  }
  return label;
}

function setBusy(busy) {
  Object.values(controls).forEach((button) => {
    button.disabled = busy;
  });
}

function send(message) {
  return chrome.runtime.sendMessage(message).then((response) => {
    if (!response?.ok) {
      throw new Error(response?.error || "Radar extension action failed.");
    }
    return response;
  });
}

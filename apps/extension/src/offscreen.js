let peerConnection = null;
let dataChannel = null;
let mediaStream = null;
let commitTimer = null;
let captureStartedAt = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "RADAR_OFFSCREEN_START") {
    startRealtime(message)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        reportError(error);
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Realtime transcription failed."
        });
      });
    return true;
  }

  if (message?.type === "RADAR_OFFSCREEN_STOP") {
    stopRealtime(message.reason || "stopped")
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        reportError(error);
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Realtime transcription stop failed."
        });
      });
    return true;
  }

  return false;
});

async function startRealtime({ clientSecret, model }) {
  if (!clientSecret) {
    throw new Error("Realtime client secret is missing.");
  }

  await stopRealtime("restart");
  captureStartedAt = performance.now();
  await reportState({
    state: "connecting",
    source: "microphone",
    partial: "",
    error: null,
    model
  });

  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true
    },
    video: false
  });

  peerConnection = new RTCPeerConnection();
  mediaStream.getAudioTracks().forEach((track) => {
    peerConnection.addTrack(track, mediaStream);
  });

  dataChannel = peerConnection.createDataChannel("oai-events");
  dataChannel.addEventListener("open", () => {
    startCommitLoop();
    reportState({
      state: "connected",
      source: "microphone",
      partial: "",
      error: null,
      model
    });
  });
  dataChannel.addEventListener("message", handleRealtimeEvent);
  dataChannel.addEventListener("close", () => {
    stopCommitLoop();
    reportState({
      state: "disconnected",
      source: "microphone",
      partial: "",
      error: null,
      model
    });
  });

  peerConnection.addEventListener("connectionstatechange", () => {
    if (["failed", "closed", "disconnected"].includes(peerConnection.connectionState)) {
      stopCommitLoop();
      reportState({
        state: peerConnection.connectionState,
        source: "microphone",
        partial: "",
        error: null,
        model
      });
    }
  });

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    body: offer.sdp,
    headers: {
      Authorization: `Bearer ${clientSecret}`,
      "Content-Type": "application/sdp"
    }
  });

  const answerSdp = await sdpResponse.text();
  if (!sdpResponse.ok) {
    throw new Error(`OpenAI Realtime WebRTC handshake failed with ${sdpResponse.status}: ${answerSdp}`);
  }

  await peerConnection.setRemoteDescription({
    type: "answer",
    sdp: answerSdp
  });
}

async function stopRealtime(reason) {
  stopCommitLoop();

  if (dataChannel) {
    dataChannel.close();
    dataChannel = null;
  }

  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  await reportState({
    state: reason || "stopped",
    source: "microphone",
    partial: "",
    error: null
  });
}

function startCommitLoop() {
  stopCommitLoop();
  commitTimer = setInterval(() => {
    if (dataChannel?.readyState === "open") {
      dataChannel.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
    }
  }, 3500);
}

function stopCommitLoop() {
  if (commitTimer) {
    clearInterval(commitTimer);
    commitTimer = null;
  }
}

function handleRealtimeEvent(event) {
  let payload;
  try {
    payload = JSON.parse(event.data);
  } catch {
    return;
  }

  if (payload.type === "conversation.item.input_audio_transcription.delta") {
    chrome.runtime.sendMessage({
      type: "RADAR_OFFSCREEN_TRANSCRIPT_DELTA",
      delta: payload.delta || "",
      itemId: payload.item_id
    });
  }

  if (payload.type === "conversation.item.input_audio_transcription.completed") {
    chrome.runtime.sendMessage({
      type: "RADAR_OFFSCREEN_TRANSCRIPT_COMPLETED",
      transcript: payload.transcript || "",
      itemId: payload.item_id,
      startedAtMs: 0,
      endedAtMs: performance.now() - captureStartedAt
    });
  }

  if (payload.type === "error") {
    reportError(payload.error?.message || "OpenAI Realtime returned an error event.");
  }
}

function reportState(transcription) {
  return chrome.runtime.sendMessage({
    type: "RADAR_OFFSCREEN_TRANSCRIPTION_STATE",
    transcription
  });
}

function reportError(error) {
  const message = error instanceof Error ? error.message : String(error || "Realtime transcription failed.");
  return chrome.runtime.sendMessage({
    type: "RADAR_OFFSCREEN_ERROR",
    error: message
  });
}

const rootId = "radar-v1-root";

let root = document.getElementById(rootId);
if (!root) {
  root = document.createElement("div");
  root.id = rootId;
  document.documentElement.appendChild(root);
}

const shadow = root.shadowRoot || root.attachShadow({ mode: "open" });
shadow.innerHTML = `
  <style>
    :host {
      all: initial;
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    button {
      font: inherit;
    }

    .indicator {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 2147483647;
      display: none;
      align-items: center;
      gap: 7px;
      border: 1px solid rgba(16, 70, 51, 0.24);
      border-radius: 999px;
      padding: 8px 11px;
      background: #ffffff;
      color: #163b2d;
      box-shadow: 0 10px 28px rgba(12, 24, 18, 0.18);
      cursor: pointer;
      font-size: 12px;
      font-weight: 800;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: #1e8f63;
      box-shadow: 0 0 0 4px rgba(30, 143, 99, 0.16);
    }

    .indicator[data-status="paused"] .dot,
    .indicator[data-status="not_configured"] .dot {
      background: #c27b1f;
      box-shadow: 0 0 0 4px rgba(194, 123, 31, 0.18);
    }

    .drawer {
      position: fixed;
      top: 82px;
      right: 18px;
      z-index: 2147483647;
      width: min(342px, calc(100vw - 36px));
      display: none;
      overflow: hidden;
      border: 1px solid rgba(26, 52, 41, 0.16);
      border-radius: 8px;
      background: #fbfcfb;
      color: #18241f;
      box-shadow: 0 24px 70px rgba(13, 27, 20, 0.2);
    }

    .drawer.open {
      display: block;
    }

    .drawer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 12px 13px;
      border-bottom: 1px solid #e3e9e5;
      background: #ffffff;
    }

    .title {
      display: grid;
      gap: 2px;
      min-width: 0;
    }

    .title strong {
      font-size: 13px;
      line-height: 1.2;
    }

    .title span {
      color: #61756b;
      font-size: 11px;
      line-height: 1.2;
      text-transform: capitalize;
    }

    .close {
      width: 28px;
      height: 28px;
      border: 1px solid #d7e0da;
      border-radius: 999px;
      background: #ffffff;
      color: #22372f;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
    }

    .body {
      display: grid;
      gap: 12px;
      padding: 13px;
    }

    .card {
      display: grid;
      gap: 8px;
      border: 1px solid #dfe7e2;
      border-radius: 8px;
      padding: 11px;
      background: #ffffff;
    }

    .lane {
      width: max-content;
      border-radius: 999px;
      padding: 3px 7px;
      background: #edf8f2;
      color: #176446;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
    }

    .card h2 {
      margin: 0;
      color: #15251e;
      font-size: 14px;
      line-height: 1.28;
    }

    .card p {
      margin: 0;
      color: #2c4038;
      font-size: 12px;
      line-height: 1.45;
    }

    .empty {
      margin: 0;
      border: 1px dashed #cbd8d1;
      border-radius: 8px;
      padding: 12px;
      color: #53685f;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.45;
    }

    .citation {
      border-top: 1px solid #edf1ef;
      padding-top: 8px;
      color: #5f7068;
      font-size: 11px;
      line-height: 1.35;
    }

    .controls {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 7px;
    }

    .controls button {
      min-height: 32px;
      border: 1px solid #ccd8d2;
      border-radius: 7px;
      background: #ffffff;
      color: #21362e;
      cursor: pointer;
      font-size: 12px;
      font-weight: 800;
    }

    .controls .end {
      border-color: #dec0bc;
      background: #fff6f4;
      color: #8b2f26;
    }
  </style>

  <button class="indicator" type="button" aria-label="Open Radar live assist">
    <span class="dot" aria-hidden="true"></span>
    <span>Radar</span>
  </button>

  <aside class="drawer" aria-live="polite">
    <header class="drawer-header">
      <div class="title">
        <strong>Radar Live Assist</strong>
        <span class="status">Idle</span>
      </div>
      <button class="close" type="button" aria-label="Close Radar drawer">x</button>
    </header>
    <section class="body">
      <div class="slot"></div>
      <div class="controls">
        <button class="pause" type="button">Pause</button>
        <button class="resume" type="button">Resume</button>
        <button class="end" type="button">End</button>
      </div>
    </section>
  </aside>
`;

const indicator = shadow.querySelector(".indicator");
const drawer = shadow.querySelector(".drawer");
const statusLabel = shadow.querySelector(".status");
const slot = shadow.querySelector(".slot");
const pauseButton = shadow.querySelector(".pause");
const resumeButton = shadow.querySelector(".resume");
const endButton = shadow.querySelector(".end");

indicator.addEventListener("click", () => drawer.classList.toggle("open"));
shadow.querySelector(".close").addEventListener("click", () => drawer.classList.remove("open"));
pauseButton.addEventListener("click", () => sendAction("pause"));
resumeButton.addEventListener("click", () => sendAction("resume"));
endButton.addEventListener("click", () => sendAction("end"));

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "RADAR_RENDER_STATE") {
    render(message.state);
  }
});

chrome.runtime.sendMessage({ type: "RADAR_GET_STATE" }).then((response) => {
  if (response?.ok) {
    render(response.state);
  }
});

function render(state) {
  const visible = ["active", "paused", "error"].includes(state.status);
  indicator.style.display = visible ? "inline-flex" : "none";
  indicator.dataset.status = state.status;
  statusLabel.textContent = labelForStatus(state.status);

  pauseButton.disabled = state.status !== "active";
  resumeButton.disabled = state.status !== "paused";

  if (state.lastCard) {
    slot.innerHTML = cardHtml(state.lastCard);
    return;
  }

  if (state.transcription?.partial || state.transcription?.lastFinal) {
    slot.innerHTML = transcriptHtml(state.transcription);
    return;
  }

  slot.innerHTML = `<p class="empty">${emptyText(state)}</p>`;
}

function cardHtml(card) {
  const citation = card.citations?.[0];
  return `
    <article class="card">
      <span class="lane">${escapeHtml(card.lane.replaceAll("_", " "))}</span>
      <h2>${escapeHtml(card.title)}</h2>
      <p>${escapeHtml(card.body)}</p>
      ${
        citation
          ? `<div class="citation">${escapeHtml(citation.title)}${citation.quote ? `: "${escapeHtml(citation.quote)}"` : ""}</div>`
          : ""
      }
    </article>
  `;
}

function transcriptHtml(transcription) {
  const text = transcription.partial || transcription.lastFinal;
  return `
    <article class="card">
      <span class="lane">Transcript</span>
      <h2>${transcription.partial ? "Live transcript" : "Latest transcript"}</h2>
      <p>${escapeHtml(text)}</p>
    </article>
  `;
}

function emptyText(state) {
  if (state.status === "not_configured") {
    return "Radar is waiting for server-side Realtime configuration.";
  }
  if (state.transcription?.state === "connecting") {
    return "Radar is connecting to Realtime transcription.";
  }
  if (state.transcription?.state === "connected") {
    return "Listening for transcript text.";
  }
  if (state.transcription?.state === "not_configured") {
    return "Realtime transcription is not configured on the server.";
  }
  if (state.status === "paused") {
    return "Radar is paused.";
  }
  if (state.status === "error") {
    return state.lastError || "Radar needs attention.";
  }
  return "No guidance card yet.";
}

function sendAction(action) {
  chrome.runtime.sendMessage({ type: "RADAR_CONTENT_ACTION", action });
}

function labelForStatus(status) {
  return String(status || "idle").replaceAll("_", " ");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

# Radar V1 Chrome Extension

This is a static Manifest V3 extension for the V1 live-assist shell.

Load it from `chrome://extensions` with **Developer mode** enabled, then choose **Load unpacked** and select `apps/extension`.

The popup defaults to `https://radar-eight-nu.vercel.app`. Change the field to `http://localhost:3000` when testing a local dev server. It calls Radar server endpoints only; it does not store or embed an OpenAI API key. Realtime browser credentials are requested from `POST /v1/sessions/{id}/client-secrets` after a server-side session exists.

The manifest key pins the unpacked extension ID to `jhjclgndbjlnnagdnphjdojinaaodeon`; the server must allow `RADAR_EXTENSION_ORIGIN=chrome-extension://jhjclgndbjlnnagdnphjdojinaaodeon`.

Capture status:

- Active-tab context is collected as URL/title metadata for preflight and session creation.
- Microphone capture runs in an offscreen document, opens a WebRTC peer connection to `https://api.openai.com/v1/realtime/calls`, and streams with the short-lived client secret returned by the Radar server.
- Completed transcription events are appended to the Radar session as `microphone` transcript segments.
- Tab-audio capture is represented as a gated plan for the future offscreen pipeline; no tab audio is streamed by this static shell.

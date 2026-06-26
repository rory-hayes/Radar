# Radar V1 Known Limitations

- Local V1 is a scaffolded vertical slice, not a deployed production system.
- Admin surfaces stay in setup/empty mode unless `RADAR_ADMIN_API_BASE_URL` and `RADAR_ADMIN_API_TOKEN` are configured.
- Session state is in memory and will reset on server restart.
- Real source ingestion, indexing, permission sync, embeddings, and search backends are not wired.
- Chrome extension microphone capture streams through an offscreen WebRTC document, but it has not been live-tested here with real OpenAI credentials.
- Tab-audio capture is planned but not complete.
- Realtime transcription was implemented from official OpenAI contracts but not exercised with real credentials here.
- Auth, SSO, rate limiting, billing, observability, and deployment hardening remain future work.
- Existing template dependencies and assets remain where still useful, though customer-facing copy has been rewritten for Radar.

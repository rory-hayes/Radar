# Radar V1 Known Limitations

- V1 is deployed and uses Supabase for workspace, invite, session, transcript, card, feedback, and audit persistence.
- Knowledge-source ingestion, indexing, permission sync, embeddings, and search backends are not wired.
- Real source ingestion, indexing, permission sync, embeddings, and search backends are not wired.
- Chrome extension microphone capture streams through an offscreen WebRTC document, but it has not been live-tested here with real OpenAI credentials.
- Tab-audio capture is planned but not complete.
- Realtime transcription has a server-minted credential path, but the Chrome extension still needs full live browser capture verification.
- SSO, billing, observability, retention jobs, and custom-domain/public deployment access remain future work.
- Existing template dependencies and assets remain where still useful, though customer-facing copy has been rewritten for Radar.

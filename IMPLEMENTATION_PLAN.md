# Radar V1 Implementation Plan

## Product Objective

Radar V1 is a hidden-until-needed real-time knowledge copilot for complex B2B technical customer conversations. The live-call user experience must stay minimal: a visible capture indicator and one-click slim drawer with one cited guidance card. The admin experience can be richer: Knowledge Studio for sources, playbooks, approvals, testing/replay, gaps, freshness, analytics, sessions, users, settings, and audit.

## Non-Negotiable Constraints

- Chrome extension and browser overlay first; no native VC integration in V1.
- Capture is explicit, visible, consent/policy-gated, and stoppable.
- No raw audio storage by default.
- OpenAI API key remains server-only; browser receives only short-lived session/channel-scoped Realtime credentials.
- OpenAI Realtime is used for live transcription, not speech-to-speech assistance.
- Answer and Proof cards require citations. Unsupported claims become Ask, Needs confirmation, or Escalate.
- Production UI paths must use real data, loading/error/unauthorized states, empty states, or a visibly gated demo mode. No ungated dummy data.
- Tenant isolation, role checks, audit events, retention/deletion, usage ledger, log redaction, and evaluation gates are product requirements, not later polish.

## Source Material Read

- All Markdown files in `radar-v1-build-spec.zip`, including `source-inputs/`, were read before implementation.
- `pasted-text-1.txt` was read and matches the master build prompt.
- Prodexa was inspected read-only from `/Users/rory/shadcn/prodexa.zip`.
- shadcn.io MCP authentication was verified for the project owner account.
- Official OpenAI docs were checked for Realtime/WebRTC/client-secret shape. Current GA guidance uses `POST /v1/realtime/client_secrets`, `/v1/realtime/calls`, and transcription sessions with `type: "transcription"` and `gpt-realtime-whisper`.

## Baseline Decision

Prodexa is a single Next.js App Router project, not a monorepo. The least disruptive V1 path is:

1. Keep the Next.js web app at the repository root for the landing page, auth shell, API routes, Knowledge Studio, and review pages.
2. Add `apps/extension` for the Manifest V3 extension.
3. Add shared domain, AI, security, and eval modules under `src/lib` and `src/components/radar` first.
4. Document the monorepo migration path, but do not block V1 on a workspace conversion unless dependency boundaries become unmanageable.

This preserves Prodexa's landing-page polish, Tailwind/shadcn conventions, bundled assets, and route structure while allowing the Chrome extension and backend API scaffold to ship quickly.

## Initial Baseline Steps

1. Unzip Prodexa into the clean Radar workspace.
2. Inspect package manager, scripts, routes, Tailwind, shadcn config, and existing UI primitives.
3. Run install, typecheck, lint, and build on the untouched baseline.
4. Commit or checkpoint the untouched baseline.
5. Keep shadcn.io MCP local-only; do not commit MCP tokens.

## Workstreams

### Orchestrator

- Own integration, repo decisions, vertical slices, quality gates, and final readiness reports.
- Prevent dummy data, client-side secrets, unsupported claims, and accidental broad scope.

### Template/UI

- Adapt Prodexa landing copy and visuals to Radar.
- Build Radar app shell, navigation, empty/loading/error primitives, and shared card/citation UI.
- Use shadcn MCP searches before adding or inventing new UI sections.

### Admin Product

- Build Knowledge Studio pages: overview, sources, source detail, uploads, connectors, playbooks, playbook detail, approvals, testing/replay, gaps, analytics, sessions, review, settings, audit.
- Pages must render empty/not-configured states until real data endpoints exist.

### Extension/Realtime

- Build Manifest V3 extension shell with popup preflight, content-script `RadarIndicator`, slim `LiveAssistDrawer`, state display, pause/resume/end, and capture scaffolding.
- Add backend endpoints for session preflight, session creation, scoped Realtime client secrets, segments, SSE events, feedback, reviews, and end session.

### AI/RAG

- Add domain schemas for transcript segments, intent events, retrieval events, guidance cards, citations, and feedback.
- Implement deterministic lane, turn assembler, retrieval interfaces, card validator, no-evidence fallback, and eval runner scaffold.

### Security/Tenant

- Add tenant, membership, role, permission, audit, retention, deletion, and usage-ledger scaffolds.
- Add server-only OpenAI config and redaction helpers.
- Ensure browser bundle cannot import server secret modules.

### QA/Release

- Add no-dummy-data audit, secret scan, unit tests for schemas/state machines/validators, and production readiness checklist.
- Run build/typecheck/lint/test and document remaining blockers honestly.

## Vertical Slices

### Slice 1: Baseline and Shell

- Checkpoint untouched Prodexa.
- Rename product to Radar.
- Add landing route content around live technical guidance.
- Add app shell routes and empty states.
- Add tenant/auth shell and environment examples.

### Slice 2: Knowledge Studio

- Source/upload/connectors pages.
- Playbook lifecycle pages.
- Approvals, Testing & Replay, gaps, analytics, sessions, review, settings, audit pages.
- All production paths use real API calls or empty/not-configured states.

### Slice 3: Extension Live UI

- Manifest V3 shell.
- Popup preflight.
- Content-script indicator.
- Slim drawer with one-card-only UI.
- Start/pause/resume/end state machine.

### Slice 4: Realtime and Sessions

- Session API routes.
- Scoped client-secret endpoint.
- Server-only OpenAI client-secret exchange.
- Segment ingestion and SSE event scaffold.
- Honest degraded/not-configured modes.

### Slice 5: AI Pipeline

- Intent and card schemas.
- Citation validator and Answer/Proof citation enforcement.
- Retrieval interface with tenant/permission/status filters in contract.
- Needs confirmation/Escalate fallback.
- Feedback and replay/eval harness.

### Slice 6: Review, Export, Security, QA

- Post-call review sections.
- Draft export with explicit confirmation.
- Deletion/audit scaffolding.
- Tests, scans, readiness reports, limitations, and next steps.

## Test And Quality Gates

- `npm install` or equivalent package-manager install.
- `npm run build`.
- TypeScript check, adding a script if the baseline lacks one.
- Lint, adapting for current Next.js if the baseline script is stale.
- Unit tests for domain schemas/state machines/validators.
- No-dummy-data scan for `lorem`, `mock`, `dummy`, `fake`, `sampleData`, `placeholder`, `hardcoded`, `Acme`, and `Globex`.
- Client bundle/source scan for `OPENAI_API_KEY` and server-only imports.
- Extension build/static validation.
- Manual browser check for landing and app shell if the app can run locally.

## Production Blockers To Track

- Real database, RLS policies, migrations, and tenant data access are required before production.
- Real auth/SSO provider integration is required before customer pilots.
- Real OpenAI Realtime credentials and endpoint tests are required for live transcription.
- Real source parsing, object storage, embeddings, and pgvector are required for production retrieval.
- A legal/customer consent policy review is required before pilots.
- Security review, pen test, restore/deletion verification, and accessibility audit remain required before broad enterprise use.

# AGENTS.md — Radar Engineering Rules for Codex

Radar continuously tests that your customer-facing business still works.

This file is mandatory context for every Codex task. Codex must read this file, `/docs/PRD.md`, `/docs/ARCHITECTURE.md`, `/tasks/TASKS.md`, and the active ticket before making changes.

## Locked product definition

Radar is a customer-facing business verification platform. It catches broken customer-facing promises before customers do by continuously verifying assertions across AI agents, docs, workflows, customer journeys, automations, and integrations.

## Core product principles

1. Radar is assertion-led, not integration-led.
2. Users define what they want verified before connecting systems.
3. Radar only asks for sources/runners needed by the active assertion.
4. The four main pages are Command Center, Assertions, Findings, and Sources.
5. The three runner types are Knowledge Runner, Journey Runner, and Integration Runner.
6. Findings must be evidence-backed and business-readable.
7. The dashboard must stay simple: checks run, exceptions, recommended fixes, critical issues.
8. Do not build a generic AI eval platform, prompt playground, trace explorer, workflow canvas, or integration marketplace.



## Shadcn / MCP rules

- Use `docs/SHADCN_MCP_AND_BLOCKS.md` and `docs/UI_BLOCKS_IMPLEMENTATION_PLAN.md` for all UI-heavy tickets.
- shadcn/ui and shadcn.io MCP are implementation accelerators, not product direction.
- Never commit a shadcn.io token, tokenized URL, bearer value, registry install URL containing a token, or screenshots/logs containing secrets.
- If `shadcnio` MCP is available, use it to search/install the smallest useful block or component.
- If MCP is unavailable, use the official shadcn CLI fallback and document the fallback in the ticket notes.
- Do not keep demo routes, demo copy, fake product concepts, or full template structures from installed blocks.
- Radar's UI must remain enterprise-grade, minimal, assertion-led, and limited to Command Center, Assertions, Findings, Sources, and explicitly scoped settings.

## Development rules

- Implement one ticket at a time.
- Do not make unrelated refactors.
- Do not invent product scope not present in the active ticket.
- Do not ship mock-only product features unless the ticket explicitly allows local demo seed data.
- Prefer small, reviewable PRs.
- Use strict TypeScript and validated inputs.
- Keep secrets server-side only.
- Preserve workspace isolation on every query and mutation.
- Add or update tests for every behavior change.
- Update the active ticket checklist before finishing.

## Required checks before a task is Done

Run the commands defined in the project once they exist. Until then, create the equivalent scripts and keep this list updated.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

If a command cannot be run, document exactly why in the task notes and do not mark the task Done unless the failure is unrelated and explicitly justified.

## Quality bar

A task is not Done because code compiles. It is Done only when the user-facing behavior, persistence, security, error states, and tests meet the active ticket's acceptance criteria.

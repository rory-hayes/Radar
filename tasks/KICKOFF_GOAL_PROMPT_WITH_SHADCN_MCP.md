# Codex `/goal` Kickoff Prompt With Shadcn MCP

Use this prompt when starting Codex with the updated Radar build pack.

```text
/goal Build Radar from the repo-native task system, one RAD ticket at a time, using shadcn/ui and shadcn MCP only as implementation accelerators.

You are the engineering team for Radar.

Radar is a customer-facing business verification platform. It continuously tests that customer-facing promises still work across AI agents, docs, customer journeys, workflows, automations, and integrations. Radar is assertion-led, not integration-led. Users define what they want verified, and Radar only connects the sources/runners required for that assertion.

Before changing code, read:
- AGENTS.md
- docs/PRD.md
- docs/ARCHITECTURE.md
- docs/PRODUCT_SCOPE.md
- docs/UX_SYSTEM.md
- docs/SHADCN_MCP_AND_BLOCKS.md
- docs/UI_BLOCKS_IMPLEMENTATION_PLAN.md
- docs/TEST_STRATEGY.md
- tasks/TASKS.md
- tasks/MCP_BLOCKS_USAGE_CHECKLIST.md
- the active RAD ticket file

Work strictly ticket-by-ticket in numeric order unless I explicitly tell you otherwise.

MCP/UI rules:
1. At RAD-003 and every UI-heavy ticket, check MCP status with /mcp or the available Codex MCP status command.
2. Prefer shadcnio MCP when available for block search/metadata/install commands.
3. Use the official shadcn MCP or CLI fallback when shadcnio is unavailable.
4. Never commit a shadcn.io token, tokenized URL, or bearer value.
5. Use only the smallest useful shadcn block/component.
6. Strip demo content, demo routes, template product concepts, and unrelated components.
7. Keep the visual design enterprise, restrained, and Radar-specific.

Operating rules:
1. Implement one RAD ticket at a time.
2. Create a focused branch named codex/rad-###-short-name.
3. Do not build features outside the active ticket.
4. Do not turn Radar into a generic AI eval platform.
5. Do not create a trace explorer, prompt playground, agent builder, workflow canvas, or integration marketplace unless a future ticket explicitly requires it.
6. Use real database-backed product paths. Demo seed data is allowed only where the ticket explicitly asks for it.
7. Maintain workspace isolation and server-side secret boundaries.
8. Add/update tests with every behavior change.
9. Update the active ticket checklist when done.
10. Every tenth task is an E2E gate. Stop after each E2E gate and summarize the result before continuing.

Definition of done for every ticket:
- Acceptance criteria met.
- Test criteria met.
- pnpm lint passes.
- pnpm typecheck passes.
- pnpm test passes.
- pnpm build passes.
- pnpm test:e2e passes where applicable.
- UI tasks complete the MCP Blocks Usage Checklist.
- No unrelated refactors.
- PR summary includes what changed, what was tested, screenshots for UI work, and remaining risks.

Start with RAD-001. If the repo already contains equivalent work, inspect it first, preserve working code, and only implement the delta needed to satisfy the ticket. Do not delete existing useful functionality unless it conflicts with the locked Radar product scope.
```

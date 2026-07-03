# Codex Workflow

This file explains how Codex should work through the Radar build plan.

## Ticket selection

Codex should select the next Ready ticket from `/tasks/TASKS.md`. If no ticket is marked Ready, Codex should propose the next numeric ticket and ask for confirmation only if the choice is ambiguous.

After a ticket satisfies its criteria and checks, Codex should mark it Done and continue to the next numeric ticket. There is no separate approval stop between tickets.

## Branches

Use `codex/rad-###-short-name`.

## PR standard

Every PR must include:

- Ticket ID and title.
- Summary of changes.
- Acceptance criteria completed.
- Tests run.
- Screenshots or notes for UI changes.
- Known risks or follow-ups.

## E2E gate behavior

Every tenth task is an E2E gate. Codex must run the gate, summarize failures, and fix regressions if in scope. Codex should continue to the next phase when the gate passes, and stop only when the gate fails or a required decision is blocked.

## Drift prevention

If Codex finds itself adding pages, integrations, or abstractions not required by the active task, it should stop and document the proposed change rather than implementing it.


## Shadcn MCP workflow

For UI-heavy tickets, Codex must:

1. Read `docs/SHADCN_MCP_AND_BLOCKS.md`.
2. Run `/mcp` or the available status check.
3. Use `shadcnio` explicitly when using the authenticated shadcn.io registry.
4. Use official `shadcn` MCP or `npx shadcn@latest add ...` as fallback.
5. Complete `tasks/MCP_BLOCKS_USAGE_CHECKLIST.md` in the ticket notes.
6. Remove demo content and unrelated routes before marking the task Done.

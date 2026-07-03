# Operating Model

This file defines how the repo-native task system should be used with Codex.

## Workflow

1. Pick the next Ready ticket from `/tasks/TASKS.md`.
2. Read the ticket, PRD, architecture, and AGENTS.md.
3. Create a branch named after the ticket ID.
4. Implement only the ticket scope.
5. Run required checks.
6. Update ticket checklist and notes.
7. Produce a clear PR summary.
8. Move the ticket to Done only when criteria pass.
9. Continue to the next numeric ticket without waiting for a separate approval stop.

## Branch naming

Use `codex/rad-###-short-name`.

## Commit style

Use concise commits that reference the ticket, for example: `RAD-041 build assertions table`.

## PR summary standard

Every PR should answer:

- What changed?
- What did not change?
- How was it tested?
- What risks remain?
- Which ticket criteria are satisfied?

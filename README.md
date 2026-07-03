# Radar Codex Build Pack

Catch broken customer-facing promises before your customers do.

This pack contains the repo-native product documentation, architecture notes, task board, detailed tickets, Codex `/goal` kickoff prompt, E2E gates, and production-readiness plan needed to build Radar from MVP to controlled production launch.

## Product lock

Radar is **customer-facing business verification**. It is not a generic AI eval dashboard. It is not a full business digital twin. It is an assertion-led platform that continuously verifies whether customer-facing promises remain true across AI agents, docs, workflows, customer journeys, automations, and integrations.

## How to use this pack

1. Copy these files into the root of the Radar repo.
2. Commit the docs and tasks before implementation starts.
3. Start Codex with `/tasks/KICKOFF_GOAL_PROMPT.md`.
4. Codex should work tickets in order from `/tasks/TASKS.md`.
5. Every tenth task is an E2E quality gate to prevent drift.
6. Do not skip gates unless you deliberately update `/tasks/QUALITY_GATES.md` and explain why.

## Required build discipline

- One task = one focused branch/PR.
- Every PR references one RAD ticket.
- Every task includes acceptance criteria, test criteria, and definition of done.
- Every tenth task forces E2E validation.
- No generic eval platform features unless they serve Radar's assertion-led model.

## Recommended first command

Paste the contents of `/tasks/KICKOFF_GOAL_PROMPT.md` into Codex using `/goal`.


## Shadcn MCP setup for Codex

This pack includes `.codex/config.toml` with two MCP servers:

- `shadcnio` — authenticated shadcn.io HTTP MCP using the `SHADCNIO_BEARER` environment header.
- `shadcn` — official shadcn/ui MCP via `npx shadcn@latest mcp`.

Before running UI tasks, configure the token outside git:

```bash
export SHADCNIO_TOKEN="paste-your-token-here"
export SHADCNIO_BEARER="Bearer $SHADCNIO_TOKEN"
```

Then restart Codex, trust the project-scoped config if prompted, and run `/mcp` to confirm the server is connected.

Use `tasks/KICKOFF_GOAL_PROMPT_WITH_SHADCN_MCP.md` as the preferred kickoff prompt.

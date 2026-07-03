# Setup for Codex Upload

## Recommended workflow

1. Upload this zip into the Radar repository or initialize a new repo from it.
2. Make sure the pack contents sit at the repository root, not nested two levels deep.
3. Configure shadcn.io MCP token outside git:

```bash
export SHADCNIO_TOKEN="paste-your-token-here"
export SHADCNIO_BEARER="Bearer $SHADCNIO_TOKEN"
```

4. Restart Codex and trust the project if prompted.
5. Run `/mcp` to confirm `shadcnio` and/or `shadcn` are available.
6. Start Codex with `tasks/KICKOFF_GOAL_PROMPT_WITH_SHADCN_MCP.md`.
7. Codex should start at RAD-001 and proceed one ticket at a time.
8. Codex must run every E2E gate: RAD-010, RAD-020, RAD-030, RAD-040, RAD-050, RAD-060, RAD-070, RAD-080, RAD-090, RAD-100. When the gate passes, Codex should continue to the next ticket without a separate approval stop.

## Do not

- Do not paste tokens into markdown files.
- Do not ask Codex to build all tasks in one PR.
- Do not skip E2E gates.
- Do not let Codex install broad templates and keep their pages.
- Do not accept any PR that fails lint, typecheck, tests, or build without a documented reason.

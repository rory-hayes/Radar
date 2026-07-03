# MCP Blocks Usage Checklist

Use this checklist for RAD-003, RAD-007, RAD-008, and every UI-heavy task.

## MCP status

- [ ] Ran `/mcp` or equivalent Codex MCP status check.
- [ ] Confirmed whether `shadcnio` is available.
- [ ] Confirmed whether official `shadcn` MCP is available.
- [ ] If unavailable, documented fallback to `npx shadcn@latest add ...`.

## Token safety

- [ ] No shadcn.io token committed.
- [ ] No full tokenized MCP URL committed.
- [ ] No tokenized registry install URL committed.
- [ ] No token value appears in logs, task notes, screenshots, or PR summary.

## Block selection

- [ ] Selected the smallest useful block/component.
- [ ] Confirmed the block supports Radar's enterprise UI direction.
- [ ] Avoided full templates and unrelated sections.
- [ ] Removed demo routes, demo copy, and fake product concepts.

## Radar fit

- [ ] Navigation remains limited to Command Center, Assertions, Findings, Sources, and explicitly scoped settings.
- [ ] UI supports assertion-led workflows.
- [ ] The page does not introduce generic eval-platform concepts.
- [ ] The page does not introduce trace explorers, prompt playgrounds, or workflow canvases.

## Testing

- [ ] Lint passes.
- [ ] Typecheck passes.
- [ ] Build passes.
- [ ] Relevant UI tests or smoke tests pass.
- [ ] Manual QA includes happy path, empty state, loading state, and at least one sad path.

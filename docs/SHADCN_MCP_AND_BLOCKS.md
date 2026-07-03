# Shadcn MCP and Blocks Plan

## Purpose

This document tells Codex how to use shadcn/ui, the official shadcn MCP server, and the shadcn.io Pro MCP registry while building Radar.

Radar must not become a generic template app. Blocks are scaffolding and implementation accelerators only. The final UI must still match Radar's locked product model: assertion-led customer-facing business verification with four main pages — Command Center, Assertions, Findings, and Sources.

## Security rule

Never commit a shadcn.io token, full MCP URL with token, registry install URL with token, or bearer value.

Use this environment pattern instead:

```bash
export SHADCNIO_TOKEN="paste-your-token-here"
export SHADCNIO_BEARER="Bearer $SHADCNIO_TOKEN"
```

The repo may include `.codex/config.toml` with `env_http_headers` pointing to `SHADCNIO_BEARER`, but the token itself must stay outside git.

## Codex MCP config

The project-scoped config is included at `.codex/config.toml`:

```toml
[mcp_servers.shadcnio]
url = "https://www.shadcn.io/api/mcp"
env_http_headers = { "Authorization" = "SHADCNIO_BEARER" }
startup_timeout_sec = 20

[mcp_servers.shadcn]
command = "npx"
args = ["shadcn@latest", "mcp"]
startup_timeout_sec = 20
```

Codex should run `/mcp` at the start of RAD-003 and any UI-heavy ticket to confirm whether `shadcnio` and/or `shadcn` are available.

If `shadcnio` is unavailable, continue with the official `shadcn` MCP or the shadcn CLI, and document the fallback in the ticket notes. Do not block product progress on MCP availability.

## Approved initial blocks/components

Codex may use these as scaffolding only:

- `dashboard-01` for the initial shell/card/table pattern.
- `sidebar-07` or the official sidebar component pattern if it fits better than `dashboard-01`.
- `login-03` only for authentication UI, if needed.
- Data-table/list/card/detail primitives for Assertions, Findings, and Sources.

Codex must strip demo copy, fake analytics, template routes, and unrelated components after installation.

## Approved shadcn primitives

Install primitives only as needed:

- `button`
- `card`
- `badge`
- `table`
- `tabs`
- `dialog`
- `sheet`
- `dropdown-menu`
- `input`
- `select`
- `textarea`
- `form`
- `separator`
- `skeleton`
- `alert`
- `sonner`
- `tooltip`
- `popover`
- `sidebar`
- `breadcrumb`
- `progress`
- `avatar`

Do not install component packs that create marketing pages, pricing pages, landing pages, e-commerce sections, or unrelated SaaS routes.

## MCP usage workflow for UI tickets

For every UI-heavy RAD ticket:

1. Read the ticket and confirm the user-facing screen required.
2. Check `/mcp` status.
3. If using MCP, search for the smallest suitable block or primitive.
4. Inspect metadata/source before installation.
5. Install the smallest relevant component/block.
6. Remove demo data and unrelated route files.
7. Refactor into Radar-owned components under the app's component structure.
8. Apply Radar design tokens from `docs/UX_SYSTEM.md`.
9. Add loading, empty, and error states.
10. Add tests or screenshots/manual QA evidence as requested by the ticket.

## What not to do

- Do not ask MCP to “build the Radar app”.
- Do not install a full admin template and keep its structure.
- Do not add navigation beyond Command Center, Assertions, Findings, Sources, and Settings where explicitly required.
- Do not use colourful toy dashboards, gradients, glassmorphism, or consumer-app styling.
- Do not introduce shadcn.io token strings into source files, PR descriptions, screenshots, logs, or task notes.

## Radar UI direction

Radar should feel like a serious enterprise operations tool:

- restrained slate/navy/white palette,
- strong typography hierarchy,
- dense but readable data surfaces,
- minimal accent colour,
- evidence-first issue detail views,
- simple executive summary dashboard,
- no visual noise.

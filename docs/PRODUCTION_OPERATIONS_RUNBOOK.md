# Production Operations Runbook

Radar production operations must keep the assertion-led product recoverable: sources, assertions, runs, findings, reports, billing, and notifications should remain workspace-scoped, evidence-backed, and auditable through every deploy and incident.

## Environments

| Environment | Purpose | Data | Deploy source |
| --- | --- | --- | --- |
| Local | Development and Codex execution | Local Supabase or empty placeholders | Local branch |
| Preview | Pull request review | Non-production data only | Vercel preview |
| Staging | Production rehearsal, migrations, performance smoke, runner checks | Production-like synthetic or approved pilot test data | Main candidate |
| Production | Customer pilots and paid usage | Customer data | Approved main deployment |

Production and staging must use strict environment validation. `RADAR_ENV=preview`, `RADAR_ENV=staging`, or `RADAR_ENV=production` requires the strict variables enforced by `scripts/validate-env.mjs`.

## Environment Variables

Required in strict environments:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `TRIGGER_SECRET_KEY`
- `RESEND_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SENTRY_AUTH_TOKEN`

Recommended or feature-specific:

- `RADAR_APP_URL`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `RESEND_FROM_EMAIL`
- `SLACK_WEBHOOK_URL`
- `STRIPE_PRICE_ID_STARTER`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_RELEASE`
- `LANGFUSE_PUBLIC_KEY`
- `LANGFUSE_SECRET_KEY`
- `LANGFUSE_BASE_URL`

Never commit real secret values. Configure production and staging secrets in the hosting provider and provider dashboards.

## Release Preflight

Run locally before requesting or promoting a production deploy:

```bash
pnpm install --frozen-lockfile
pnpm validate:env
pnpm validate:seed
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm perf:pilot
pnpm build
pnpm audit --audit-level high
pnpm db:harness
```

When Docker is running locally, also run:

```bash
pnpm db:harness:apply
```

The Docker-backed apply step must apply all migrations, load seeds, and run the static harness before a migration-bearing release goes to staging or production.

## Deployment Procedure

1. Confirm the candidate branch contains only reviewed RAD-ticket work.
2. Confirm CI passes on the candidate branch.
3. Confirm strict staging env values are present and `RADAR_ENV=staging`.
4. Apply pending migrations to staging with the migration procedure below.
5. Deploy the candidate to staging.
6. Smoke staging routes: `/`, `/sign-in`, `/command-center`, `/assertions`, `/findings`, `/sources`, `/settings`, `/api/workspace/export`.
7. Run a staging source sync, assertion rerun, finding lifecycle update, weekly report export, and billing settings load.
8. Check Sentry, Langfuse, PostHog, Resend, Stripe, and Supabase logs for new errors or unexpected PII.
9. Promote the same reviewed commit to production.
10. Repeat route and workflow smoke checks against production.
11. Record deployment time, commit SHA, migration names, operator, and smoke results in the release notes or incident log.

## Migration Procedure

Use the pinned Supabase CLI through pnpm.

For staging:

```bash
pnpm exec supabase link --project-ref <staging-project-ref>
pnpm exec supabase db push --dry-run --linked
pnpm exec supabase db push --linked
```

For production:

```bash
pnpm exec supabase link --project-ref <production-project-ref>
pnpm exec supabase db push --dry-run --linked
pnpm exec supabase db push --linked
```

Migration rules:

- Take or confirm a database backup before production schema changes.
- Review every migration file named in the dry run.
- Do not use `--include-seed` against staging or production unless a ticket explicitly calls for it.
- Prefer additive migrations. For destructive data changes, create a written rollback and restore plan before deployment.
- After pushing migrations, run focused product smoke checks for any changed table, RLS policy, storage bucket, function, or enum.

## Rollback

Application rollback:

1. Stop additional production promotions.
2. Use Vercel deployment history to promote the last known-good production deployment.
3. Confirm `/sign-in`, `/command-center`, `/sources`, and `/findings` load.
4. Check Sentry for continuing errors and PostHog for severe drop-offs.

Database rollback:

- Supabase migrations in this repo are forward-only. Prefer a forward-fix migration when possible.
- If data corruption or destructive migration impact is confirmed, restore from the latest verified Supabase backup or point-in-time recovery option for the production project.
- Do not run ad hoc SQL against production without recording the exact SQL, operator, affected rows, and verification query.

Provider rollback:

- Stripe: keep webhook endpoint and price IDs stable; if checkout breaks, disable the Settings checkout action by removing or rotating `STRIPE_PRICE_ID_STARTER` while preserving read-only billing state.
- Resend/Slack: disable notification dispatch by rotating or removing the provider key/webhook after confirming user-facing workflows can still complete.
- OpenAI/Langfuse: disable optional tracing by removing Langfuse keys; do not remove `OPENAI_API_KEY` unless AI features must be intentionally paused.

## Cron And Job Operations

Radar's operational jobs are assertion-led. Jobs should be tied to source syncs, embeddings, evaluation runs, finding reruns, weekly reports, and notifications.

Daily checks:

- Review queued/running/error `evaluation_runs`.
- Review source records stuck in `syncing` or `error`.
- Review `abuse_limit_events` for spikes in source sync, eval run, AI call, API request, file upload, and runner execution events.
- Review notification deliveries with `failed` status.
- Review Sentry issues and Langfuse LLM traces for new regressions.

Pause procedure:

1. Pause provider-side schedules in Trigger.dev or the scheduler owner before changing application code.
2. Disable affected assertion schedules or source-change triggers where possible.
3. Keep product read paths online unless customer data integrity is at risk.
4. Record the pause reason, affected workspaces, and resume criteria.

Resume procedure:

1. Confirm the root cause is fixed or the provider incident is resolved.
2. Resume schedules in a small batch.
3. Watch queue depth, error rate, Sentry events, provider rate limits, and notification failures.

## Backups And Data Recovery

Production backup expectations:

- Supabase Postgres backups or PITR are enabled and verified before pilot launch.
- Private `radar-evidence-artifacts` storage has a provider-level backup/export plan.
- Stripe, Sentry, Langfuse, PostHog, and Resend are treated as provider systems of record for their own operational data.
- Workspace JSON export is a customer portability artifact, not a production restore mechanism.

Quarterly recovery drill:

1. Restore the latest staging-safe backup into a non-production Supabase project.
2. Run migrations to the current schema.
3. Run representative route, source, assertion, run, finding, export, and notification smoke checks.
4. Record restore duration and any manual steps that blocked recovery.

## Incident Response

Severity guide:

- SEV-1: customer data exposure, cross-workspace access, production outage, destructive data loss, billing corruption.
- SEV-2: major workflow unavailable, runner queue stalled, high error rate, failed notifications for critical findings.
- SEV-3: degraded UX, isolated source sync failures, non-critical provider issue.

First 15 minutes:

1. Assign an incident owner.
2. Identify affected environment, workspace IDs, commit SHA, deploy time, provider status, and first failing route/job.
3. Stop further deploys.
4. Decide whether to rollback app, pause jobs, rotate secrets, or disable a provider integration.
5. Start an incident log with timestamps and commands.

Customer data incident:

- Preserve logs and do not delete evidence.
- Rotate affected secrets.
- Check RLS policies, storage object paths, audit logs, and Sentry breadcrumbs.
- Identify affected workspace IDs and record the exact exposure window.
- Prepare customer notification with facts only after verification.

Post-incident:

- Document root cause, blast radius, timeline, remediation, tests added, and follow-up owners.
- Add regression tests before closing the incident where code or config caused the issue.

## Support Procedures

Login or workspace access:

- Confirm Supabase Auth status and the user's `workspace_members` row.
- Verify role and status before changing permissions.
- Do not bypass workspace membership through direct client-provided workspace IDs.

Source sync failure:

- Inspect `sources.last_sync_error`, source type, origin URL, and latest source versions.
- Retry only after correcting source input or provider availability.
- Do not paste raw customer source content into logs, tickets, Sentry, Langfuse, or analytics.

Finding dispute:

- Review finding evidence, source citations, run/result metadata, and activity history.
- Use lifecycle actions to mark fixed, resolved, ignored, or false positive.
- Keep resolution summaries bounded and customer-readable.

Billing support:

- Use Stripe as the source of truth for payment state.
- Confirm `billing_customers` plan and subscription status.
- Do not edit Stripe identifiers directly in the database.

Data export or deletion:

- Direct workspace admins to Settings for workspace export.
- Use source detail deletion for source-level deletion.
- For broader deletion requests, follow `docs/DATA_LIFECYCLE.md` and record the requester, workspace, scope, operator, and completion evidence.

## Launch Checklist

- CI green on the release commit.
- `pnpm perf:pilot` under budget.
- `pnpm audit --audit-level high` clean.
- Staging migration dry run reviewed.
- Staging smoke complete.
- Production backup confirmed.
- Sentry, Langfuse, PostHog, Resend, Stripe, Supabase dashboards accessible.
- Rollback target identified.
- Incident owner and support contact available during launch window.

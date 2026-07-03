# Deployment and Environments

Radar should support local, preview, staging, and production environments.

## Local

Used for development with local Supabase, local env files, seed data, and safe mocked external services where explicitly allowed.

## Preview

Used for pull request previews with isolated environment variables and non-production data.

## Staging

Used for production-like testing, migrations, runner jobs, and E2E gates before production.

## Production

Used for pilot and customer usage with strict secret handling, monitoring, backups, and incident response.

## Deployment principle

No production deploy should run unreviewed migrations, expose secrets, skip tests, or bypass E2E gates.

Use [Production Operations Runbook](PRODUCTION_OPERATIONS_RUNBOOK.md) for release preflight, deployment, migrations, rollback, cron/job operations, incident response, backups, and support procedures.

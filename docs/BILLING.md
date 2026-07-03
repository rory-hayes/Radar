# Billing

Radar billing is workspace-scoped. Stripe identifiers live in `billing_customers`; product records stay in their existing tables and are never deleted or rewritten when payment state changes.

## Stripe environment

Required in strict environments:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Required to start paid checkout from settings:

- `RADAR_APP_URL`
- `STRIPE_PRICE_ID_STARTER`

`STRIPE_PRICE_ID_STARTER` is optional in environment validation so local builds can run without Stripe, but checkout returns a safe configuration error until the value is present.

## Plan gates

Plan limits are defined in `src/lib/billing/schema.ts` and enforced before mutations that increase usage:

- assertions: `createAssertionAction` and AI-generated assertion drafts
- sources: `createSourceAction`
- runs: manual assertion reruns and finding validation reruns

Unpaid paid plans use a safe paused state. New assertions, sources, and runs are blocked while existing assertions, sources, findings, reports, and settings remain readable.

## Stripe flow

Workspace admins can start checkout or open the billing portal from Settings. Checkout creates or reuses a Stripe customer, then redirects to a Stripe Checkout subscription session.

Stripe webhooks are accepted at `/api/billing/stripe-webhook`. The route verifies the `stripe-signature` header with `STRIPE_WEBHOOK_SECRET` before updating `billing_customers` with a service-role Supabase client.

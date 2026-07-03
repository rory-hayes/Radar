import * as Sentry from "@sentry/nextjs";

import { buildRadarSentryOptions } from "@/lib/observability/sentry";

Sentry.init(buildRadarSentryOptions("client") as unknown as Parameters<typeof Sentry.init>[0]);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

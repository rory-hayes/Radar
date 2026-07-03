import * as Sentry from "@sentry/nextjs";

import { buildRadarSentryOptions } from "@/lib/observability/sentry";

Sentry.init(buildRadarSentryOptions("edge") as unknown as Parameters<typeof Sentry.init>[0]);

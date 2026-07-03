import "server-only";

import { publicEnv } from "@/lib/env/server";
import {
  productAnalyticsEventSchemas,
  type ProductAnalyticsEventName,
  type ProductAnalyticsProperties,
} from "@/lib/analytics/events";

export type TrackProductEventInput<EventName extends ProductAnalyticsEventName = ProductAnalyticsEventName> = {
  event: EventName;
  properties: ProductAnalyticsProperties[EventName];
};

export type TrackProductEventResult =
  | {
      status: "sent";
    }
  | {
      status: "skipped";
      reason: string;
    }
  | {
      status: "failed";
      error: string;
    };

type TrackProductEventOptions = {
  posthogKey?: string;
  posthogHost?: string;
  fetcher?: typeof fetch;
};

export async function trackProductEvent<EventName extends ProductAnalyticsEventName>(
  input: TrackProductEventInput<EventName>,
  options: TrackProductEventOptions = {},
): Promise<TrackProductEventResult> {
  const posthogKey = options.posthogKey ?? publicEnv.NEXT_PUBLIC_POSTHOG_KEY;

  if (!posthogKey) {
    return {
      status: "skipped",
      reason: "NEXT_PUBLIC_POSTHOG_KEY is not configured.",
    };
  }

  const parsedProperties = productAnalyticsEventSchemas[input.event].safeParse(input.properties);

  if (!parsedProperties.success) {
    return {
      status: "failed",
      error: `Invalid analytics properties for ${input.event}.`,
    };
  }
  const posthogHost = normalizedPostHogHost(options.posthogHost ?? publicEnv.NEXT_PUBLIC_POSTHOG_HOST);

  if (!posthogHost) {
    return {
      status: "failed",
      error: "NEXT_PUBLIC_POSTHOG_HOST must be an HTTP or HTTPS URL when configured.",
    };
  }

  const distinctId = "userId" in parsedProperties.data && parsedProperties.data.userId
    ? parsedProperties.data.userId
    : parsedProperties.data.workspaceId;
  const fetcher = options.fetcher ?? fetch;
  let response: Response;

  try {
    response = await fetcher(`${posthogHost}/capture/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: posthogKey,
        event: input.event,
        distinct_id: distinctId,
        properties: posthogProperties(parsedProperties.data),
      }),
    });
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "PostHog capture request failed.",
    };
  }

  if (!response.ok) {
    return {
      status: "failed",
      error: `PostHog capture failed with status ${response.status}: ${await boundedResponseText(response)}`,
    };
  }

  return { status: "sent" };
}

function posthogProperties(properties: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(properties).map(([key, value]) => [camelToSnakeCase(key), value]),
  );
}

function camelToSnakeCase(value: string) {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function normalizedPostHogHost(value: string | undefined) {
  if (!value) {
    return "https://app.posthog.com";
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return undefined;
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

async function boundedResponseText(response: Response) {
  const text = await response.text().catch(() => "");
  return text.slice(0, 500) || "No response body.";
}

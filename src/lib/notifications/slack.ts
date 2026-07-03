import "server-only";

import { serverEnv } from "@/lib/env/server";
import type { SlackBlock } from "@/lib/notifications/slack-templates";

export type SlackWebhookInput = {
  text: string;
  blocks: SlackBlock[];
};

export type SlackWebhookResult =
  | {
      status: "sent";
      providerMessageId: string;
    }
  | {
      status: "skipped";
      reason: string;
    }
  | {
      status: "failed";
      error: string;
    };

type SlackWebhookOptions = {
  webhookUrl?: string;
  fetcher?: typeof fetch;
};

export async function sendSlackWebhookAlert(
  input: SlackWebhookInput,
  options: SlackWebhookOptions = {},
): Promise<SlackWebhookResult> {
  const webhookUrl = options.webhookUrl ?? serverEnv.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      status: "skipped",
      reason: "SLACK_WEBHOOK_URL is not configured.",
    };
  }

  const parsedWebhookUrl = parseSlackWebhookUrl(webhookUrl);

  if (!parsedWebhookUrl) {
    return {
      status: "failed",
      error: "SLACK_WEBHOOK_URL must be an HTTPS URL.",
    };
  }

  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(parsedWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: input.text,
      blocks: input.blocks,
    }),
  });

  if (!response.ok) {
    return {
      status: "failed",
      error: `Slack webhook request failed with status ${response.status}: ${await boundedResponseText(response)}`,
    };
  }

  return {
    status: "sent",
    providerMessageId: `slack-webhook-${Date.now()}`,
  };
}

function parseSlackWebhookUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

async function boundedResponseText(response: Response) {
  const text = await response.text().catch(() => "");
  return text.slice(0, 500) || "No response body.";
}

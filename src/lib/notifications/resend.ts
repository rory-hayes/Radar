import "server-only";

import { serverEnv } from "@/lib/env/server";

export type ResendEmailInput = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  tags?: { name: string; value: string }[];
};

export type ResendEmailResult =
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

type ResendOptions = {
  apiKey?: string;
  fetcher?: typeof fetch;
};

const resendEmailsUrl = "https://api.resend.com/emails";

export async function sendResendEmail(input: ResendEmailInput, options: ResendOptions = {}): Promise<ResendEmailResult> {
  const apiKey = options.apiKey ?? serverEnv.RESEND_API_KEY;

  if (!apiKey) {
    return {
      status: "skipped",
      reason: "RESEND_API_KEY is not configured.",
    };
  }

  if (!input.from.trim()) {
    return {
      status: "skipped",
      reason: "RESEND_FROM_EMAIL is not configured.",
    };
  }

  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(resendEmailsUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: input.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      tags: input.tags,
    }),
  });

  if (!response.ok) {
    return {
      status: "failed",
      error: `Resend email request failed with status ${response.status}: ${await boundedResponseText(response)}`,
    };
  }

  const payload = await response.json().catch(() => null) as { id?: string } | null;

  return {
    status: "sent",
    providerMessageId: payload?.id ?? "resend-message",
  };
}

async function boundedResponseText(response: Response) {
  const text = await response.text().catch(() => "");
  return text.slice(0, 500) || "No response body.";
}

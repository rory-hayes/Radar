"use client";

import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState<
    | {
        tone: "success" | "error";
        message: string;
      }
    | null
  >(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            message?: string;
            error?: {
              message?: string;
            };
          }
        | null;

      if (!response.ok || !payload?.ok) {
        setStatus({
          tone: "error",
          message: payload?.error?.message ?? "Unable to send a reset email.",
        });
        return;
      }

      setStatus({
        tone: "success",
        message: payload.message ?? "If that email has Radar access, a reset link has been sent.",
      });
      setEmail("");
    } catch {
      setStatus({
        tone: "error",
        message: "Unable to reach the password reset service.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="flex w-full max-w-md flex-col gap-4" onSubmit={submit}>
      {status ? (
        <Alert variant={status.tone === "error" ? "destructive" : "default"}>
          {status.tone === "error" ? <AlertCircle /> : <CheckCircle2 />}
          <AlertTitle>{status.tone === "error" ? "Reset failed" : "Check your email"}</AlertTitle>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      ) : null}

      <label className="flex flex-col gap-2 text-left">
        <span className="text-sm font-medium text-zinc-700">Email</span>
        <Input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isPending}
          placeholder="you@company.com"
          type="email"
        />
      </label>

      <Button type="submit" disabled={isPending || email.trim().length === 0}>
        {isPending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Send data-icon="inline-start" />}
        Send reset link
      </Button>

      <Button asChild variant="outline">
        <Link href="/auth/sign-in">Back to sign in</Link>
      </Button>
    </form>
  );
}

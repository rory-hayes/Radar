"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type AcceptState =
  | {
      status: "loading";
      message: string;
    }
  | {
      status: "success";
      message: string;
    }
  | {
      status: "error";
      message: string;
    };

export function AcceptInviteClient() {
  const router = useRouter();
  const [state, setState] = useState<AcceptState>({
    status: "loading",
    message: "Accepting your Radar invite...",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token") ?? query.get("access_token");

    window.history.replaceState(null, "", "/auth/accept-invite");

    if (!accessToken) {
      setState({
        status: "error",
        message: "This invite link did not include an access token. Ask your admin to send a new invite.",
      });
      return;
    }

    acceptInvite(accessToken)
      .then((next) => {
        setState({
          status: "success",
          message: "Invite accepted. Opening your Radar setup...",
        });
        router.replace(next);
      })
      .catch((error) => {
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Radar could not accept this invite. Ask your admin to send a new invite.",
        });
      });
  }, [router]);

  return (
    <section className="flex w-full max-w-md flex-col items-center justify-center text-center">
      <div className="flex size-14 items-center justify-center rounded-lg bg-zinc-950 text-white">
        {state.status === "loading" ? (
          <Loader2 className="animate-spin" />
        ) : state.status === "success" ? (
          <CheckCircle2 />
        ) : (
          <AlertCircle />
        )}
      </div>
      <h2 className="mt-6 text-2xl font-semibold tracking-normal text-black">
        {state.status === "error" ? "Invite link needs attention" : "Joining Radar"}
      </h2>
      <p className="mt-4 text-base leading-7 text-black/65">
        Radar is connecting you to the shared workspace before opening your setup flow.
      </p>

      <Alert
        variant={state.status === "error" ? "destructive" : "default"}
        className="mt-6 text-left"
      >
        {state.status === "loading" ? <Loader2 className="animate-spin" /> : null}
        {state.status === "success" ? <CheckCircle2 /> : null}
        {state.status === "error" ? <AlertCircle /> : null}
        <AlertTitle>
          {state.status === "error"
            ? "Invite not accepted"
            : state.status === "success"
              ? "Invite accepted"
              : "Checking invite"}
        </AlertTitle>
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>

      {state.status === "error" ? (
        <Button asChild className="mt-6 w-full">
          <Link href="/auth/sign-in">Back to sign in</Link>
        </Button>
      ) : null}
    </section>
  );
}

async function acceptInvite(accessToken: string) {
  const response = await fetch("/api/auth/accept-invite", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ accessToken }),
  });
  const payload = (await response.json().catch(() => null)) as
    | {
        ok?: boolean;
        next?: string;
        error?: {
          message?: string;
        };
      }
    | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error?.message ?? "Radar could not accept this invite.");
  }

  return payload.next ?? "/app?onboarding=user";
}

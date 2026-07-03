"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircleIcon, LoaderCircleIcon } from "lucide-react";
import { type FormEvent, useId, useMemo, useState } from "react";

import { normalizeAuthRedirectPath } from "@/lib/auth/redirects";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type AuthMode = "sign-in" | "sign-up";

type AuthFormProps = {
  mode: AuthMode;
  nextPath?: string;
  routeError?: string;
};

const copyByMode: Record<
  AuthMode,
  {
    title: string;
    description: string;
    submitLabel: string;
    pendingLabel: string;
    footerPrompt: string;
    footerHref: string;
    footerLabel: string;
  }
> = {
  "sign-in": {
    title: "Sign in to Radar",
    description: "Access your customer-facing business verification workspace.",
    submitLabel: "Sign in",
    pendingLabel: "Signing in",
    footerPrompt: "Need access?",
    footerHref: "/sign-up",
    footerLabel: "Create an account",
  },
  "sign-up": {
    title: "Create your Radar account",
    description: "Start with assertions before connecting sources or runners.",
    submitLabel: "Create account",
    pendingLabel: "Creating account",
    footerPrompt: "Already have access?",
    footerHref: "/sign-in",
    footerLabel: "Sign in",
  },
};

export function AuthForm({ mode, nextPath, routeError }: AuthFormProps) {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const safeNextPath = normalizeAuthRedirectPath(nextPath);
  const copy = copyByMode[mode];
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(routeError ?? "");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!supabase) {
      setError("Supabase authentication is not configured for this environment.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Enter an email and password.");
      return;
    }

    setIsPending(true);

    if (mode === "sign-in") {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      setIsPending(false);

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.replace(safeNextPath);
      router.refresh();
      return;
    }

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNextPath)}`;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    setIsPending(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.replace(safeNextPath);
      router.refresh();
      return;
    }

    setSuccess("Check your email to confirm your account before signing in.");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {!supabase ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Authentication unavailable</AlertTitle>
                <AlertDescription>
                  Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to enable this flow.
                </AlertDescription>
              </Alert>
            ) : null}
            {error ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Authentication failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {success ? (
              <Alert>
                <AlertTitle>Account created</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            ) : null}
            <Field>
              <FieldLabel htmlFor={emailId}>Email</FieldLabel>
              <Input id={emailId} name="email" type="email" autoComplete="email" disabled={!supabase || isPending} required />
            </Field>
            <Field>
              <FieldLabel htmlFor={passwordId}>Password</FieldLabel>
              <Input
                id={passwordId}
                name="password"
                type="password"
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                minLength={8}
                disabled={!supabase || isPending}
                required
              />
              <FieldDescription>Use at least 8 characters.</FieldDescription>
              <FieldError />
            </Field>
            <Button type="submit" disabled={!supabase || isPending}>
              {isPending ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : null}
              {isPending ? copy.pendingLabel : copy.submitLabel}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <span className="text-sm text-muted-foreground">{copy.footerPrompt}</span>
        <Button asChild variant="link" size="sm">
          <Link href={`${copy.footerHref}?next=${encodeURIComponent(safeNextPath)}`}>{copy.footerLabel}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

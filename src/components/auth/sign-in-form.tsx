"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { SignInSchema } from "@/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { PasswordInput } from "../ui/password-input";
import { z } from "zod";

type RecoveryTokenState = {
  accessToken: string;
  refreshToken: string;
};

const SignInForm = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [recoveryToken, setRecoveryToken] =
    useState<RecoveryTokenState | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetPending, setIsResetPending] = useState(false);

  const form = useForm<z.infer<typeof SignInSchema>>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    const type = hash.get("type");

    if (type === "recovery" && accessToken && refreshToken) {
      setRecoveryToken({ accessToken, refreshToken });
      window.history.replaceState(null, "", "/auth/sign-in?from=recovery");
      return;
    }

    if (query.get("from") === "recovery-complete") {
      setNotice("Password updated. Sign in with your new password.");
      return;
    }

    if (query.get("from") === "recovery") {
      setNotice("Open the latest reset link from your email, then choose a new password here.");
    }
  }, []);

  const onSubmit = async (values: z.infer<typeof SignInSchema>) => {
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(values),
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: {
              message?: string;
            };
          }
        | null;

      if (!response.ok || !payload?.ok) {
        setError(payload?.error?.message ?? "Unable to sign in.");
        return;
      }

      router.push(getSafeNextPath());
      router.refresh();
    } catch {
      setError("Unable to reach the authentication service.");
    } finally {
      setIsPending(false);
    }
  };

  const onResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!recoveryToken) {
      return;
    }

    setResetError(null);
    setIsResetPending(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          accessToken: recoveryToken.accessToken,
          refreshToken: recoveryToken.refreshToken,
          password: resetPassword,
          confirmPassword: confirmResetPassword,
        }),
        cache: "no-store",
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
        setResetError(payload?.error?.message ?? "Unable to update this password.");
        return;
      }

      router.replace(payload.next ?? "/app?onboarding=user");
      router.refresh();
    } catch {
      setResetError("Unable to reach the password reset service.");
    } finally {
      setIsResetPending(false);
    }
  };

  if (recoveryToken) {
    return (
      <div className="flex w-full max-w-md flex-col">
        <form className="flex w-full flex-col gap-5" onSubmit={onResetPassword}>
          {resetError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Password not updated</AlertTitle>
              <AlertDescription>{resetError}</AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Reset link verified</AlertTitle>
              <AlertDescription>
                Choose a new Radar password for this workspace account.
              </AlertDescription>
            </Alert>
          )}

          <label className="grid gap-2">
            <span className="text-sm font-medium text-zinc-700">New password</span>
            <PasswordInput
              value={resetPassword}
              onChange={(event) => setResetPassword(event.target.value)}
              disabled={isResetPending}
              placeholder="New password"
              minLength={8}
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-zinc-700">Confirm password</span>
            <PasswordInput
              value={confirmResetPassword}
              onChange={(event) => setConfirmResetPassword(event.target.value)}
              disabled={isResetPending}
              placeholder="Confirm password"
              minLength={8}
              required
            />
          </label>

          <Button
            type="submit"
            disabled={
              isResetPending ||
              resetPassword.length < 8 ||
              confirmResetPassword.length < 8
            }
          >
            {isResetPending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
            Update password
          </Button>
        </form>

        <Button asChild variant="link" className="mt-4 h-auto px-0 py-0 text-primary">
          <Link href="/auth/forgot-password">Request a new reset link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full flex-col gap-5">
          {notice ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Password recovery</AlertTitle>
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Sign in failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex w-full flex-col gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="Email"
                      type="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      {...field}
                      disabled={isPending}
                      placeholder="Password"
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex w-full items-center justify-end">
              <Button asChild variant="link" className="h-auto px-0 py-0 text-primary">
                <Link href="/auth/forgot-password">Forgot password?</Link>
              </Button>
            </div>
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
            Sign In
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-sm leading-6 text-black/60">
        Need access? Ask your Radar workspace admin to add your account.
      </p>
    </div>
  );
};

function getSafeNextPath() {
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/app";
  }

  return next;
}

export default SignInForm;

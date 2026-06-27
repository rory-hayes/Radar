"use client";

import logoIcon from "@/assets/icons/logo-icon.svg";
import Image from "next/image";
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
import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { PasswordInput } from "../ui/password-input";
import { z } from "zod";

const SignInForm = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof SignInSchema>>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

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

  return (
    <div className="mx-auto flex h-full w-full max-w-sm flex-col items-center justify-center">
      <div className="inline-flex h-20 aspect-square items-center justify-center rounded-xl border bg-white shadow-md">
        <Image width={32} height={36} src={logoIcon} alt="Logo icon" className="h-auto w-8" />
      </div>

      <div className="mt-6 flex w-full flex-col items-center text-center">
        <h2 className="text-3xl font-medium text-black">Welcome back!</h2>
        <p className="mt-2 text-base leading-6 text-black/70">
          Sign in with your Radar workspace email and password.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 flex w-full flex-col gap-5">
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

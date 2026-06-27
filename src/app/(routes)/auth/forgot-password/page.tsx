import { Button } from "@/components/ui/button";
import Hero from "@/sections/hero";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Password Recovery | Radar",
  description: "Recover access to a Radar workspace account.",
};

export default function ForgotPasswordPage() {
  return (
    <div>
      <Hero>
        <section className="mx-auto flex w-full max-w-md flex-col items-center justify-center rounded-3xl border border-input bg-white/90 p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-950 text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-normal text-black">
            Reset your password
          </h1>
          <p className="mt-4 text-base leading-7 text-black/65">
            Password recovery is handled by your Radar workspace admin in this
            build. Ask an admin to reset your account password, then return to
            sign in.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild variant="outline">
              <Link href="/auth/sign-in">
                <ArrowLeft data-icon="inline-start" />
                Back to sign in
              </Link>
            </Button>
          </div>
        </section>
      </Hero>
    </div>
  );
}

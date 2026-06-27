import logoIcon from "@/assets/icons/logo-icon.svg";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

const flowSteps = [
  "Admin creates a workspace",
  "Workspace knowledge is uploaded or connected",
  "Users join, install Radar, and review ended calls",
];

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#f6f8fb] p-4 text-zinc-950">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-lg border border-zinc-200 bg-white lg:grid-cols-[minmax(0,1fr)_minmax(26rem,0.78fr)]">
        <section className="flex flex-col justify-between gap-10 border-b border-zinc-200 p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg border border-zinc-200 bg-white">
                <Image width={28} height={32} src={logoIcon} alt="" className="h-auto w-7" />
              </span>
              <span>
                <span className="block text-sm font-semibold">Radar</span>
                <span className="block text-xs text-zinc-500">Workspace copilot</span>
              </span>
            </Link>

            <div className="mt-12 max-w-xl">
              <h1 className="text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl">
                {title}
              </h1>
              <p className="mt-4 text-base leading-7 text-zinc-600">{description}</p>
            </div>
          </div>

          <div className="grid gap-3">
            {flowSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-zinc-700">{step}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-8">
          {children}
        </section>
      </div>
    </main>
  );
}

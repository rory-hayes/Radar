"use client";

import {
  Activity,
  BarChart3,
  FileClock,
  FileSearch,
  Gauge,
  LogOut,
  PlugZap,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  activePaths?: string[];
};

const primaryNav: AdminNavItem[] = [
  { href: "/app", label: "Overview", icon: Gauge },
  {
    href: "/app/sources",
    label: "Knowledge",
    icon: FileSearch,
    activePaths: [
      "/app/uploads",
      "/app/playbooks",
      "/app/approvals",
      "/app/knowledge-gaps",
    ],
  },
  { href: "/app/connectors", label: "Connectors", icon: PlugZap },
  { href: "/app/users", label: "Users", icon: Users },
  {
    href: "/app/sessions",
    label: "Calls",
    icon: Activity,
    activePaths: ["/app/calls", "/app/testing"],
  },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
];

const secondaryNav: AdminNavItem[] = [
  { href: "/app/settings", label: "Settings", icon: Settings, activePaths: ["/app/audit-log"] },
];

export function AdminShell({
  children,
  authEmail,
}: {
  children: ReactNode;
  authEmail?: string;
}) {
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);

    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        cache: "no-store",
      });
    } finally {
      window.location.assign("/auth/sign-in");
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-zinc-950">
      <div className="border-b border-zinc-200 bg-white lg:hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/app" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white">
              <FileClock className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">Radar</div>
              <div className="text-xs text-zinc-500">Workspace</div>
            </div>
          </Link>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700"
            disabled={isSigningOut}
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
        <nav
          aria-label="Radar workspace sections"
          className="flex gap-2 overflow-x-auto px-4 pb-4"
        >
          {[...primaryNav, ...secondaryNav].map((item) => (
            <AdminNavLink key={item.href} item={item} pathname={pathname} compact />
          ))}
        </nav>
      </div>

      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-zinc-200 bg-white lg:flex lg:flex-col">
        <div className="border-b border-zinc-200 px-6 py-6">
          <Link href="/app" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-950 text-white">
              <FileClock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-semibold">Radar</div>
              <div className="text-sm text-zinc-500">Workspace</div>
            </div>
          </Link>
        </div>

        <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-5">
          <nav aria-label="Radar workspace sections" className="flex flex-col gap-1">
            {primaryNav.map((item) => (
              <AdminNavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>

          <nav
            aria-label="Radar workspace settings"
            className="flex flex-col gap-1 border-t border-zinc-200 pt-4"
          >
            {authEmail ? (
              <div className="px-3 pb-3 text-xs leading-5 text-zinc-500">
                Signed in as <span className="font-medium text-zinc-700">{authEmail}</span>
              </div>
            ) : null}
            {secondaryNav.map((item) => (
              <AdminNavLink key={item.href} item={item} pathname={pathname} />
            ))}
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-50"
              disabled={isSigningOut}
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </nav>
        </div>
      </aside>

      <main className="lg:pl-72">
        <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function AdminNavLink({
  item,
  pathname,
  compact = false,
}: {
  item: AdminNavItem;
  pathname: string;
  compact?: boolean;
}) {
  const Icon = item.icon;
  const active =
    item.href === "/app"
      ? pathname === "/app" || pathname === "/app/overview"
      : pathname.startsWith(item.href) ||
        Boolean(item.activePaths?.some((activePath) => pathname.startsWith(activePath)));

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
        compact ? "shrink-0 px-3 py-2" : "px-3 py-2.5",
        active
          ? "bg-zinc-950 text-white"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="whitespace-nowrap">{item.label}</span>
    </Link>
  );
}

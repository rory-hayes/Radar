"use client";

import {
  Activity,
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  FileClock,
  FileSearch,
  Gauge,
  History,
  Layers3,
  PlayCircle,
  PlugZap,
  Settings,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const primaryNav: AdminNavItem[] = [
  { href: "/app", label: "Overview", icon: Gauge },
  { href: "/app/sources", label: "Sources", icon: FileSearch },
  { href: "/app/uploads", label: "Uploads", icon: UploadCloud },
  { href: "/app/connectors", label: "Connectors", icon: PlugZap },
  { href: "/app/playbooks", label: "Playbooks", icon: BookOpenCheck },
  { href: "/app/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/app/testing", label: "Testing & Replay", icon: PlayCircle },
  { href: "/app/knowledge-gaps", label: "Knowledge Gaps", icon: Layers3 },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/sessions", label: "Sessions", icon: Activity },
];

const secondaryNav: AdminNavItem[] = [
  { href: "/app/settings", label: "Settings", icon: Settings },
  { href: "/app/audit-log", label: "Audit log", icon: History },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

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
              <div className="text-xs text-zinc-500">Knowledge Studio</div>
            </div>
          </Link>
        </div>
        <nav
          aria-label="Knowledge Studio sections"
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
              <div className="text-sm text-zinc-500">Knowledge Studio</div>
            </div>
          </Link>
        </div>

        <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-5">
          <nav aria-label="Knowledge Studio sections" className="space-y-1">
            {primaryNav.map((item) => (
              <AdminNavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>

          <nav
            aria-label="Knowledge Studio settings"
            className="space-y-1 border-t border-zinc-200 pt-4"
          >
            {secondaryNav.map((item) => (
              <AdminNavLink key={item.href} item={item} pathname={pathname} />
            ))}
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
    item.href === "/app" ? pathname === "/app" || pathname === "/app/overview" : pathname.startsWith(item.href);

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

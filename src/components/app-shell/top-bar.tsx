"use client";

import { LogOutIcon, SearchIcon, ShieldCheckIcon, UserCircleIcon } from "lucide-react";

import { StatusBadge } from "@/components/radar/status-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { type RadarAuthenticatedUser } from "@/lib/auth/session";
import { type RadarWorkspaceMembership } from "@/lib/workspaces/schema";

type TopBarProps = {
  user: RadarAuthenticatedUser;
  membership: RadarWorkspaceMembership;
};

export function TopBar({ user, membership }: TopBarProps) {
  const roleLabel = membership.role[0].toUpperCase() + membership.role.slice(1);

  return (
    <header className="sticky top-0 flex h-14 shrink-0 items-center gap-3 border-b border-border/80 bg-background/95 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="-ml-1" aria-label="Toggle navigation" />
      <Separator orientation="vertical" className="hidden h-5 md:block" />

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="hidden min-w-0 flex-1 justify-start text-muted-foreground md:flex lg:max-w-md"
          disabled
        >
          <SearchIcon data-icon="inline-start" />
          <span className="truncate">Search assertions, findings, sources</span>
        </Button>
        <StatusBadge label="Local" className="hidden md:inline-flex">
          <ShieldCheckIcon data-icon="inline-start" />
        </StatusBadge>
        <StatusBadge label={membership.workspace.name} className="hidden lg:inline-flex" />
        <StatusBadge label={roleLabel} className="hidden xl:inline-flex" />
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <div className="hidden min-w-0 items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm md:flex">
          <UserCircleIcon data-icon="inline-start" />
          <span className="max-w-48 truncate">{user.email ?? "Authenticated user"}</span>
        </div>
        <form action="/auth/sign-out" method="post">
          <Button type="submit" variant="outline">
            <LogOutIcon data-icon="inline-start" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </form>
      </div>
    </header>
  );
}

"use client";

import { SearchIcon, ShieldCheckIcon, UserCircleIcon } from "lucide-react";

import { StatusBadge } from "@/components/radar/status-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopBar() {
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
      </div>

      <Button type="button" variant="outline" disabled>
        <UserCircleIcon data-icon="inline-start" />
        <span className="hidden sm:inline">User menu</span>
      </Button>
    </header>
  );
}

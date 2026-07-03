"use client";

import {
  LogOutIcon,
  SearchIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "lucide-react";

import { StatusBadge } from "@/components/radar/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const userInitial = (user.email ?? "User").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 flex h-14 shrink-0 items-center gap-3 border-b border-border/80 bg-background/95 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="-ml-1" aria-label="Toggle navigation" />
      <Separator orientation="vertical" className="hidden h-5 md:block" />

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="hidden min-w-0 flex-1 justify-start text-muted-foreground md:flex lg:max-w-md"
          aria-label="Global search placeholder"
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="max-w-52 justify-start">
              <Avatar className="size-5">
                <AvatarFallback>{userInitial}</AvatarFallback>
              </Avatar>
              <span className="hidden truncate sm:inline">{user.email ?? "User menu"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>User menu</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem disabled>
                <UserCircleIcon />
                <span className="truncate">{user.email ?? "Authenticated user"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <ShieldCheckIcon />
                <span>{roleLabel} in {membership.workspace.name}</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <form action="/auth/sign-out" method="post">
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full">
                  <LogOutIcon />
                  <span>Sign out</span>
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

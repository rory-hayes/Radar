"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { TopBar } from "@/components/app-shell/top-bar";
import { type RadarAuthenticatedUser } from "@/lib/auth/session";
import { type RadarWorkspaceMembership } from "@/lib/workspaces/schema";

type AppShellProps = {
  children: React.ReactNode;
  user: RadarAuthenticatedUser;
  membership: RadarWorkspaceMembership;
};

export function AppShell({ children, user, membership }: AppShellProps) {
  return (
    <SidebarProvider>
      <SidebarNav membership={membership} />
      <SidebarInset>
        <div className="flex min-h-svh flex-col">
          <TopBar user={user} membership={membership} />
          <main className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

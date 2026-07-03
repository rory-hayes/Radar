"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { TopBar } from "@/components/app-shell/top-bar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset>
        <div className="flex min-h-svh flex-col">
          <TopBar />
          <main className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

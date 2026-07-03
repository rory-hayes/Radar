"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ActivityIcon,
  AlertTriangleIcon,
  DatabaseIcon,
  FileCheck2Icon,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { primaryAppRoutes, type PrimaryAppRouteId } from "@/lib/radar-routes";

const navIcons: Record<PrimaryAppRouteId, LucideIcon> = {
  "command-center": ActivityIcon,
  assertions: FileCheck2Icon,
  findings: AlertTriangleIcon,
  sources: DatabaseIcon,
};

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-12">
              <Link href="/command-center" aria-label="Radar Command Center">
                <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
                  R
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold">Radar</span>
                  <span className="truncate text-xs text-muted-foreground">Business verification</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Verification</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryAppRoutes.map((route) => {
                const Icon = navIcons[route.id];
                const isActive = pathname === route.href || pathname.startsWith(`${route.href}/`);

                return (
                  <SidebarMenuItem key={route.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={route.href}>
                        <Icon />
                        <span>{route.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex flex-col gap-2 rounded-lg border border-sidebar-border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-sidebar-foreground">Environment</span>
            <Badge variant="outline">Local</Badge>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">Local workspace</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

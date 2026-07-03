"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ActivityIcon,
  AlertTriangleIcon,
  Building2Icon,
  CheckIcon,
  ChevronsUpDownIcon,
  DatabaseIcon,
  FileCheck2Icon,
  PlusIcon,
  type LucideIcon,
} from "lucide-react";

import { StatusBadge } from "@/components/radar/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { primaryAppRoutes, type PrimaryAppRouteId } from "@/lib/radar-routes";
import { type RadarWorkspaceMembership } from "@/lib/workspaces/schema";

const navIcons: Record<PrimaryAppRouteId, LucideIcon> = {
  "command-center": ActivityIcon,
  assertions: FileCheck2Icon,
  findings: AlertTriangleIcon,
  sources: DatabaseIcon,
};

type SidebarNavProps = {
  membership: RadarWorkspaceMembership;
};

export function SidebarNav({ membership }: SidebarNavProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const workspaceInitial = membership.workspace.name.charAt(0).toUpperCase();

  function closeMobileNav() {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-12" aria-label="Workspace selector placeholder">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
                    {workspaceInitial || "R"}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold">{membership.workspace.name}</span>
                    <span className="truncate text-xs text-muted-foreground">Current workspace</span>
                  </span>
                  <ChevronsUpDownIcon className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="start">
                <DropdownMenuLabel>Workspace</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem disabled>
                    <Building2Icon />
                    <span className="truncate">{membership.workspace.name}</span>
                    <CheckIcon className="ml-auto" />
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/workspace/new" onClick={closeMobileNav}>
                      <PlusIcon />
                      <span>Create workspace</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm">
              <Link href="/command-center" aria-label="Radar Command Center" onClick={closeMobileNav}>
                <span className="flex size-6 items-center justify-center rounded-md bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
                  R
                </span>
                <span>Business verification</span>
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
                      <Link href={route.href} onClick={closeMobileNav}>
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
            <StatusBadge label="Local" />
          </div>
          <p className="text-xs leading-5 text-muted-foreground">Local workspace</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

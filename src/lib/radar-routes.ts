export const primaryAppRoutes = [
  {
    id: "command-center",
    title: "Command Center",
    href: "/command-center",
    description: "Daily view of checks, exceptions, recommended fixes, and critical customer-facing issues.",
  },
  {
    id: "assertions",
    title: "Assertions",
    href: "/assertions",
    description: "Business truths Radar continuously verifies.",
  },
  {
    id: "findings",
    title: "Findings",
    href: "/findings",
    description: "Evidence-backed exceptions with impact, confidence, and recommended fixes.",
  },
  {
    id: "sources",
    title: "Sources",
    href: "/sources",
    description: "Evidence inputs connected only when active assertions need them.",
  },
] as const;

export const settingsRoute = {
  id: "settings",
  title: "Settings",
  href: "/settings",
  description: "Workspace configuration kept outside primary V1 navigation.",
  hiddenFromPrimaryNav: true,
} as const;

export const weeklyReportRoute = {
  id: "weekly-report",
  title: "Weekly trust report",
  href: "/reports/weekly",
  description: "Workspace trust report kept outside primary V1 navigation.",
  hiddenFromPrimaryNav: true,
} as const;

export const appRoutes = [...primaryAppRoutes, settingsRoute, weeklyReportRoute] as const;

export type PrimaryAppRoute = (typeof primaryAppRoutes)[number];
export type AppRoute = (typeof appRoutes)[number];
export type PrimaryAppRouteId = PrimaryAppRoute["id"];

export function getAppRouteByHref(href: string): AppRoute | undefined {
  return appRoutes.find((route) => route.href === href);
}

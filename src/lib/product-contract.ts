export const corePages = [
  {
    name: "Command Center",
    purpose: "Daily operational summary of checks, exceptions, recommended fixes, and critical customer-facing issues.",
  },
  {
    name: "Assertions",
    purpose: "Business truths Radar continuously verifies.",
  },
  {
    name: "Findings",
    purpose: "Evidence-backed exceptions with impact, confidence, and recommended fixes.",
  },
  {
    name: "Sources",
    purpose: "Evidence inputs connected only when active assertions need them.",
  },
] as const;

export const runnerTypes = [
  "Knowledge Runner",
  "Journey Runner",
  "Integration Runner",
] as const;

export const lockedNonGoals = [
  "Generic AI eval dashboard",
  "LLM trace explorer",
  "Prompt playground",
  "Agent builder",
  "Workflow automation builder",
  "Integration marketplace",
] as const;

export type CorePageName = (typeof corePages)[number]["name"];
export type RunnerType = (typeof runnerTypes)[number];

export function isCorePageName(pageName: string): pageName is CorePageName {
  return corePages.some((page) => page.name === pageName);
}

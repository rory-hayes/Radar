export const demoDataAllowedEnvironments = ["local", "test"] as const;

export const demoDataProhibitedEnvironments = ["preview", "staging", "production"] as const;

export const demoSeedContract = {
  seedEntrypoint: "supabase/seed.sql",
  seedDirectory: "supabase/seeds",
  resetCommand: "pnpm db:reset",
  requiredWorkspaceScope: "workspace_id",
  deterministicIdsRequired: true,
  productRuntimeImportsAllowed: false,
  externalNetworkCallsAllowed: false,
  realCustomerDataAllowed: false,
} as const;

export type DemoDataEnvironment = (typeof demoDataAllowedEnvironments)[number];
export type ProductionLikeEnvironment = (typeof demoDataProhibitedEnvironments)[number];

export function isDemoDataEnvironment(environment: string): environment is DemoDataEnvironment {
  return demoDataAllowedEnvironments.includes(environment as DemoDataEnvironment);
}

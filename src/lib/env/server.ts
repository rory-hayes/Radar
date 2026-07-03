import { validateEnv } from "@/lib/env/schema";

export const env = validateEnv();

export const publicEnv = env.publicEnv;
export const serverEnv = env.serverEnv;

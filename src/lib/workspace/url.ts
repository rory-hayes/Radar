import { readEnv } from "@/lib/env";

export function getAppUrl() {
  const configuredUrl = readEnv(process.env.NEXT_PUBLIC_APP_URL) || readEnv(process.env.AUTH_URL);

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const vercelUrl = readEnv(process.env.VERCEL_URL);
  if (vercelUrl) {
    return `https://${vercelUrl}`.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

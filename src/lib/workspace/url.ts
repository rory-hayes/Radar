import { readEnv } from "@/lib/env";

export function getAppUrl() {
  const configuredUrl =
    readEnv(process.env.RADAR_APP_URL) ||
    readEnv(process.env.NEXT_PUBLIC_APP_URL) ||
    readEnv(process.env.AUTH_URL);

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const vercelUrl =
    readEnv(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    readEnv(process.env.VERCEL_BRANCH_URL) ||
    readEnv(process.env.VERCEL_URL);
  if (vercelUrl) {
    return withHttps(vercelUrl).replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    return "https://radar-eight-nu.vercel.app";
  }

  return "http://localhost:3000";
}

function withHttps(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

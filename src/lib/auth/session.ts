import "server-only";

import { cookies } from "next/headers";

import { getSupabaseAuthClient } from "@/lib/supabase/server";
import { readEnv } from "@/lib/env";
import {
  getWorkspaceMemberByEmail,
  normalizeEmail,
  upsertWorkspaceMember,
} from "@/lib/workspace/store";

import { AUTH_COOKIE_NAME } from "./constants";
export { AUTH_COOKIE_NAME } from "./constants";

const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 8;
const SESSION_TTL_SECONDS = parseSessionTtl(readEnv(process.env.RADAR_AUTH_SESSION_TTL_SECONDS));
const LOCAL_AUTH_PASSWORD = readEnv(process.env.RADAR_LOCAL_AUTH_PASSWORD) ?? "radar-access";

type AuthMode = "password" | "local" | "supabase";

export type AuthSession = {
  email: string;
  issuedAt: string;
  expiresAt: string;
  mode: AuthMode;
};

type AuthRuntime =
  | {
      state: "ready";
      mode: AuthMode;
      secret: string;
      password?: string;
      allowedEmails: Set<string>;
    }
  | {
      state: "not_configured";
      missing: string[];
    };

declare global {
  var __radarLocalAuthSecret: string | undefined;
}

const encoder = new TextEncoder();

function parseSessionTtl(value: string | undefined) {
  if (!value?.trim()) {
    return DEFAULT_SESSION_TTL_SECONDS;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SESSION_TTL_SECONDS;
}

function getLocalSecret() {
  globalThis.__radarLocalAuthSecret ??= crypto.randomUUID();
  return globalThis.__radarLocalAuthSecret;
}

function getAuthRuntime(): AuthRuntime {
  const secret = readEnv(process.env.AUTH_SECRET) || readEnv(process.env.RADAR_AUTH_SECRET);
  const password = readEnv(process.env.RADAR_AUTH_PASSWORD);
  const localMode = process.env.NODE_ENV !== "production";

  if (password && secret) {
    return {
      state: "ready",
      mode: "password",
      secret,
      password,
      allowedEmails: parseAllowedEmails(readEnv(process.env.RADAR_AUTH_ALLOWED_EMAILS)),
    };
  }

  if (localMode) {
    return {
      state: "ready",
      mode: "local",
      secret: secret || getLocalSecret(),
      password: password || LOCAL_AUTH_PASSWORD,
      allowedEmails: new Set(),
    };
  }

  return {
    state: "not_configured",
    missing: [
      ...(secret ? [] : ["AUTH_SECRET"]),
      ...(password ? [] : ["RADAR_AUTH_PASSWORD"]),
    ],
  };
}

function parseAllowedEmails(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function base64Url(input: string | Uint8Array) {
  return Buffer.from(input).toString("base64url");
}

async function signPayload(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return base64Url(new Uint8Array(signature));
}

async function verifySignature(payload: string, signature: string, secret: string) {
  const expected = await signPayload(payload, secret);
  return safeEqual(expected, signature);
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

function isAllowedEmail(email: string, allowedEmails: Set<string>) {
  return allowedEmails.size === 0 || allowedEmails.has(email.toLowerCase());
}

function authCookieOptions(maxAge?: number) {
  const supportsExtensionRequests = Boolean(readEnv(process.env.RADAR_EXTENSION_ORIGIN));
  const sameSite = supportsExtensionRequests ? "none" : "lax";

  return {
    httpOnly: true,
    sameSite,
    secure: process.env.NODE_ENV === "production" || sameSite === "none",
    path: "/",
    ...(typeof maxAge === "number" ? { maxAge } : {}),
  } as const;
}

async function createToken(session: AuthSession, secret: string) {
  const payload = base64Url(JSON.stringify(session));
  const signature = await signPayload(payload, secret);
  return `${payload}.${signature}`;
}

async function readToken(token: string | undefined, secret: string) {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature || !(await verifySignature(payload, signature, secret))) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AuthSession;
    if (!session.email || !session.expiresAt || Date.parse(session.expiresAt) <= Date.now()) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export async function authenticatePassword(input: { email: string; password: string }) {
  const supabaseResult = await authenticateSupabasePassword(input);
  if (supabaseResult.ok) {
    return supabaseResult;
  }

  const runtime = getAuthRuntime();

  if (runtime.state === "not_configured") {
    return {
      ok: false as const,
      status: 503,
      code: "auth_not_configured",
      message: "Password sign-in is not configured for this environment.",
      missing: runtime.missing,
    };
  }

  if (!isAllowedEmail(input.email, runtime.allowedEmails)) {
    return {
      ok: false as const,
      status: 401,
      code: "invalid_credentials",
      message: "Email or password did not match.",
    };
  }

  if (
    (runtime.mode === "password" || runtime.mode === "local") &&
    !safeEqual(input.password, runtime.password ?? "")
  ) {
    return {
      ok: false as const,
      status: 401,
      code: "invalid_credentials",
      message: "Email or password did not match.",
    };
  }

  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + SESSION_TTL_SECONDS * 1000);
  const session: AuthSession = {
    email: input.email.toLowerCase(),
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    mode: runtime.mode,
  };

  return {
    ok: true as const,
    session,
    token: await createToken(session, runtime.secret),
    maxAge: SESSION_TTL_SECONDS,
  };
}

async function authenticateSupabasePassword(input: { email: string; password: string }) {
  const supabase = getSupabaseAuthClient();
  const email = normalizeEmail(input.email);

  if (!supabase) {
    return { ok: false as const };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });

  if (error || !data.user) {
    return { ok: false as const };
  }

  const member = await getWorkspaceMemberByEmail(email);
  const allowedEmails = parseAllowedEmails(readEnv(process.env.RADAR_AUTH_ALLOWED_EMAILS));

  if (!member && !isAllowedEmail(email, allowedEmails)) {
    return { ok: false as const };
  }

  if (member?.status === "disabled") {
    return { ok: false as const };
  }

  if (member?.status === "invited") {
    await upsertWorkspaceMember({
      email,
      role: member.role,
      status: "active",
      onboardingState: member.onboardingState,
      acceptedAt: new Date().toISOString(),
    });
  }

  if (!member && isAllowedEmail(email, allowedEmails)) {
    await upsertWorkspaceMember({
      email,
      role: "admin",
      status: "active",
      onboardingState: "complete",
      acceptedAt: new Date().toISOString(),
    });
  }

  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + SESSION_TTL_SECONDS * 1000);
  const session: AuthSession = {
    email,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    mode: "supabase",
  };
  const runtime = getAuthRuntime();

  if (runtime.state === "not_configured") {
    return {
      ok: false as const,
    };
  }

  return {
    ok: true as const,
    session,
    token: await createToken(session, runtime.secret),
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function getAuthSession() {
  const runtime = getAuthRuntime();
  if (runtime.state === "not_configured") {
    return null;
  }

  const cookieStore = await cookies();
  return readToken(cookieStore.get(AUTH_COOKIE_NAME)?.value, runtime.secret);
}

export async function setAuthSessionCookie(token: string, maxAge: number) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    ...authCookieOptions(maxAge),
  });
}

export async function clearAuthSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, "", {
    ...authCookieOptions(),
    expires: new Date(0),
  });
}

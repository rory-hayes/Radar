import "server-only";

type RateLimitInput = {
  key: string;
  windowMs: number;
  max: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type RateLimitResult =
  | {
      allowed: true;
      remaining: number;
      resetAt: number;
    }
  | {
      allowed: false;
      retryAfterSeconds: number;
      resetAt: number;
    };

declare global {
  var __radarRateLimitStore: Map<string, RateLimitBucket> | undefined;
}

const buckets = globalThis.__radarRateLimitStore ?? (globalThis.__radarRateLimitStore = new Map());

export function consumeRateLimit(input: RateLimitInput): RateLimitResult {
  const now = Date.now();
  const current = buckets.get(input.key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + input.windowMs;
    buckets.set(input.key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: input.max - 1,
      resetAt,
    };
  }

  if (current.count >= input.max) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
      resetAt: current.resetAt,
    };
  }

  current.count += 1;
  buckets.set(input.key, current);

  return {
    allowed: true,
    remaining: input.max - current.count,
    resetAt: current.resetAt,
  };
}

export function rateLimitIdentity(request: Request, prefix: string, subject?: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const userAgent = request.headers.get("user-agent")?.trim() || "unknown-agent";
  return [prefix, subject?.toLowerCase() || forwardedFor || realIp || "unknown-ip", userAgent].join(":");
}

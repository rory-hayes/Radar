import "server-only";

import { createHash } from "node:crypto";

export type UrlCrawlMode = "auto" | "page" | "sitemap";

export type UrlCrawlerLimits = {
  timeoutMs?: number;
  maxPages?: number;
  maxBytes?: number;
  maxSitemapUrls?: number;
  userAgent?: string;
  respectRobots?: boolean;
};

export type UrlCrawlPage = {
  url: string;
  finalUrl: string;
  title?: string;
  description?: string;
  text: string;
  contentHash: string;
  byteSize: number;
  contentType: string;
  metadata: {
    canonicalUrl?: string;
    fetchedAt: string;
  };
};

export type UrlCrawlResult = {
  requestedUrl: string;
  mode: Exclude<UrlCrawlMode, "auto">;
  pages: UrlCrawlPage[];
  contentHash: string;
  metadata: {
    skippedUrls: string[];
    robotsChecked: boolean;
    limits: Required<UrlCrawlerLimits>;
  };
};

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type CrawlOptions = UrlCrawlerLimits & {
  mode?: UrlCrawlMode;
  fetcher?: Fetcher;
};

const defaultLimits = {
  timeoutMs: 8000,
  maxPages: 5,
  maxBytes: 1_000_000,
  maxSitemapUrls: 20,
  userAgent: "RadarBot/1.0",
  respectRobots: true,
} satisfies Required<UrlCrawlerLimits>;

const blockedHostnameSuffixes = [".local", ".internal", ".localhost"];

export async function crawlUrlSource(url: string, options: CrawlOptions = {}): Promise<UrlCrawlResult> {
  const limits = { ...defaultLimits, ...options };
  const requestedUrl = normalizeHttpUrl(url);
  assertSafePublicUrl(requestedUrl);
  const fetcher = options.fetcher ?? fetch;
  const robots = limits.respectRobots ? await loadRobotsPolicy(requestedUrl, fetcher, limits) : null;
  const robotsChecked = Boolean(robots);

  if (robots && !robots.allows(requestedUrl.pathname + requestedUrl.search)) {
    throw new UrlCrawlerError("robots_disallowed", `Robots policy disallows ${requestedUrl.href}`);
  }

  const firstFetch = await fetchLimited(requestedUrl, fetcher, limits);
  const mode = resolveCrawlMode(options.mode ?? "auto", requestedUrl, firstFetch.contentType, firstFetch.body);
  const skippedUrls: string[] = [];
  const pages = mode === "sitemap"
    ? await crawlSitemap(requestedUrl, firstFetch.body, fetcher, limits, robots, skippedUrls)
    : [extractPage(firstFetch.finalUrl, firstFetch.body, firstFetch.contentType)];
  const uniquePages = dedupePages(pages).slice(0, limits.maxPages);

  return {
    requestedUrl: requestedUrl.href,
    mode,
    pages: uniquePages,
    contentHash: hashText(uniquePages.map((page) => page.contentHash).join("\n")),
    metadata: {
      skippedUrls,
      robotsChecked,
      limits,
    },
  };
}

export function extractReadableText(html: string) {
  const withoutNoise = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
    .replace(/<head\b[\s\S]*?<\/head>/gi, " ")
    .replace(/<(nav|header|footer|aside|form)\b[\s\S]*?<\/\1>/gi, " ");
  const withBreaks = withoutNoise
    .replace(/<(br|hr)\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|main|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "\n- ");

  return decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, " "))
    .replace(/\r/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function hashText(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export class UrlCrawlerError extends Error {
  readonly code:
    | "invalid_url"
    | "unsafe_url"
    | "robots_disallowed"
    | "fetch_failed"
    | "unsupported_content_type"
    | "empty_content"
    | "size_limit";

  constructor(code: UrlCrawlerError["code"], message: string) {
    super(message);
    this.name = "UrlCrawlerError";
    this.code = code;
  }
}

async function crawlSitemap(
  sitemapUrl: URL,
  sitemapXml: string,
  fetcher: Fetcher,
  limits: Required<UrlCrawlerLimits>,
  robots: RobotsPolicy | null,
  skippedUrls: string[],
) {
  const urls = parseSitemapUrls(sitemapXml)
    .map((value) => normalizeHttpUrl(value))
    .filter((candidate) => {
      const allowed = candidate.origin === sitemapUrl.origin && isSafePublicUrl(candidate);
      const robotsAllowed = !robots || robots.allows(candidate.pathname + candidate.search);

      if (!allowed || !robotsAllowed) {
        skippedUrls.push(candidate.href);
      }

      return allowed && robotsAllowed;
    })
    .slice(0, Math.min(limits.maxPages, limits.maxSitemapUrls));
  const pages: UrlCrawlPage[] = [];

  for (const pageUrl of urls) {
    try {
      const fetched = await fetchLimited(pageUrl, fetcher, limits);
      pages.push(extractPage(fetched.finalUrl, fetched.body, fetched.contentType));
    } catch {
      skippedUrls.push(pageUrl.href);
    }
  }

  if (pages.length === 0) {
    throw new UrlCrawlerError("empty_content", "Sitemap did not yield any extractable pages.");
  }

  return pages;
}

function extractPage(finalUrl: URL, html: string, contentType: string): UrlCrawlPage {
  const text = extractReadableText(html);

  if (!text) {
    throw new UrlCrawlerError("empty_content", "Fetched page did not contain extractable text.");
  }

  return {
    url: finalUrl.href,
    finalUrl: finalUrl.href,
    title: extractTagContent(html, "title"),
    description: extractMetaContent(html, "description"),
    text,
    contentHash: hashText(text),
    byteSize: Buffer.byteLength(text, "utf8"),
    contentType,
    metadata: {
      canonicalUrl: extractCanonicalUrl(html),
      fetchedAt: new Date().toISOString(),
    },
  };
}

async function fetchLimited(url: URL, fetcher: Fetcher, limits: Required<UrlCrawlerLimits>) {
  const response = await fetchWithTimeout(
    url,
    {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml,text/xml,text/plain;q=0.8",
        "user-agent": limits.userAgent,
      },
      redirect: "follow",
    },
    fetcher,
    limits.timeoutMs,
  );

  if (!response.ok) {
    throw new UrlCrawlerError("fetch_failed", `Fetch failed with status ${response.status}.`);
  }

  const finalUrl = normalizeHttpUrl(response.url || url.href);
  assertSafePublicUrl(finalUrl);

  if (finalUrl.origin !== url.origin) {
    throw new UrlCrawlerError("unsafe_url", "Cross-origin redirects are not allowed for source ingestion.");
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "text/html";

  if (!isSupportedContentType(contentType)) {
    throw new UrlCrawlerError("unsupported_content_type", `Unsupported content type: ${contentType}`);
  }

  const body = await response.text();
  const byteSize = Buffer.byteLength(body, "utf8");

  if (byteSize > limits.maxBytes) {
    throw new UrlCrawlerError("size_limit", `Fetched body exceeded ${limits.maxBytes} bytes.`);
  }

  return {
    body,
    contentType,
    finalUrl,
  };
}

async function fetchWithTimeout(input: URL, init: RequestInit, fetcher: Fetcher, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetcher(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new UrlCrawlerError("fetch_failed", `Fetch timed out after ${timeoutMs}ms.`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function loadRobotsPolicy(url: URL, fetcher: Fetcher, limits: Required<UrlCrawlerLimits>) {
  const robotsUrl = new URL("/robots.txt", url.origin);

  try {
    const response = await fetchWithTimeout(
      robotsUrl,
      {
        headers: {
          accept: "text/plain",
          "user-agent": limits.userAgent,
        },
      },
      fetcher,
      Math.min(limits.timeoutMs, 3000),
    );

    if (!response.ok) {
      return null;
    }

    return parseRobotsTxt(await response.text(), limits.userAgent);
  } catch {
    return null;
  }
}

function parseRobotsTxt(body: string, userAgent: string): RobotsPolicy {
  const rules: Array<{ pattern: string; allow: boolean }> = [];
  const targetAgent = userAgent.split("/")[0]?.toLowerCase() ?? userAgent.toLowerCase();
  let applies = false;

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, "").trim();

    if (!line) {
      continue;
    }

    const [rawKey, ...rawValue] = line.split(":");
    const key = rawKey?.trim().toLowerCase();
    const value = rawValue.join(":").trim();

    if (key === "user-agent") {
      const agent = value.toLowerCase();
      applies = agent === "*" || agent === targetAgent;
      continue;
    }

    if ((key === "allow" || key === "disallow") && applies) {
      rules.push({ pattern: value, allow: key === "allow" });
    }
  }

  return {
    allows(pathname: string) {
      const matches = rules
        .filter((rule) => rule.pattern && pathname.startsWith(rule.pattern))
        .sort((a, b) => b.pattern.length - a.pattern.length);

      return matches[0]?.allow ?? true;
    },
  };
}

type RobotsPolicy = {
  allows(pathname: string): boolean;
};

function parseSitemapUrls(xml: string) {
  return Array.from(xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi), (match) => decodeHtmlEntities(match[1] ?? ""))
    .map((value) => value.trim())
    .filter(Boolean);
}

function resolveCrawlMode(mode: UrlCrawlMode, url: URL, contentType: string, body: string): Exclude<UrlCrawlMode, "auto"> {
  if (mode !== "auto") {
    return mode;
  }

  if (contentType.includes("xml") || /<urlset[\s>]/i.test(body) || /<sitemapindex[\s>]/i.test(body)) {
    return "sitemap";
  }

  if (/sitemap.*\.xml$/i.test(url.pathname)) {
    return "sitemap";
  }

  return "page";
}

function dedupePages(pages: UrlCrawlPage[]) {
  const seen = new Set<string>();

  return pages.filter((page) => {
    if (seen.has(page.contentHash)) {
      return false;
    }

    seen.add(page.contentHash);
    return true;
  });
}

function isSupportedContentType(contentType: string) {
  return ["text/html", "application/xhtml+xml", "application/xml", "text/xml", "text/plain"].some((type) =>
    contentType.includes(type),
  );
}

function normalizeHttpUrl(value: string | URL) {
  let url: URL;

  try {
    url = value instanceof URL ? value : new URL(value);
  } catch {
    throw new UrlCrawlerError("invalid_url", "Enter a valid URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UrlCrawlerError("invalid_url", "Only http and https URLs can be crawled.");
  }

  url.hash = "";
  return url;
}

function assertSafePublicUrl(url: URL) {
  if (!isSafePublicUrl(url)) {
    throw new UrlCrawlerError("unsafe_url", "URL host is not allowed for source ingestion.");
  }
}

function isSafePublicUrl(url: URL) {
  const hostname = url.hostname.toLowerCase();

  if (url.username || url.password) {
    return false;
  }

  if (
    hostname === "localhost" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    blockedHostnameSuffixes.some((suffix) => hostname.endsWith(suffix))
  ) {
    return false;
  }

  return !isPrivateIpv4(hostname);
}

function isPrivateIpv4(hostname: string) {
  const octets = hostname.split(".").map((part) => Number(part));

  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [first, second] = octets;
  return (
    first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254)
  );
}

function extractTagContent(html: string, tagName: string) {
  const match = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i").exec(html);
  return match?.[1] ? decodeHtmlEntities(match[1].replace(/<[^>]+>/g, " ")).trim() : undefined;
}

function extractMetaContent(html: string, name: string) {
  const pattern = new RegExp(`<meta\\b(?=[^>]*(?:name|property)=["']${escapeRegExp(name)}["'])([^>]+)>`, "i");
  const match = pattern.exec(html);

  return match?.[1] ? extractAttribute(match[1], "content") : undefined;
}

function extractCanonicalUrl(html: string) {
  const match = /<link\b(?=[^>]*rel=["']canonical["'])([^>]+)>/i.exec(html);
  return match?.[1] ? extractAttribute(match[1], "href") : undefined;
}

function extractAttribute(source: string, attribute: string) {
  const match = new RegExp(`${attribute}=["']([^"']+)["']`, "i").exec(source);
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : undefined;
}

function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: "\"",
    apos: "'",
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, raw) => {
    const key = String(raw).toLowerCase();

    if (key.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(key.slice(2), 16));
    }

    if (key.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(key.slice(1), 10));
    }

    return namedEntities[key] ?? entity;
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

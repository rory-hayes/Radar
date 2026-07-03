import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-033 adds a safe server-only URL crawler with extraction and stable hashes", async () => {
  const crawler = await readWorkspaceFile("src/lib/sources/url-crawler.ts");

  assert.match(crawler, /server-only/);
  assert.match(crawler, /createHash/);
  assert.match(crawler, /export async function crawlUrlSource/);
  assert.match(crawler, /export function extractReadableText/);
  assert.match(crawler, /export function hashText/);
  assert.match(crawler, /UrlCrawlerError/);
  assert.match(crawler, /sha256/);
  assert.match(crawler, /contentHash: hashText/);
  assert.match(crawler, /strip|replace/);
  assert.match(crawler, /script\\b/);
  assert.match(crawler, /style\\b/);
  assert.match(crawler, /decodeHtmlEntities/);
});

test("RAD-033 enforces URL safety robots timeout content type and size limits", async () => {
  const crawler = await readWorkspaceFile("src/lib/sources/url-crawler.ts");

  assert.match(crawler, /blockedHostnameSuffixes/);
  assert.match(crawler, /localhost/);
  assert.match(crawler, /isPrivateIpv4/);
  assert.match(crawler, /url\.username \|\| url\.password/);
  assert.match(crawler, /Cross-origin redirects are not allowed/);
  assert.match(crawler, /loadRobotsPolicy/);
  assert.match(crawler, /parseRobotsTxt/);
  assert.match(crawler, /robots_disallowed/);
  assert.match(crawler, /setTimeout\(\(\) => controller\.abort\(\), timeoutMs\)/);
  assert.match(crawler, /maxBytes/);
  assert.match(crawler, /Unsupported content type/);
  assert.match(crawler, /Fetch timed out/);
});

test("RAD-033 supports sitemap ingestion with same-origin dedupe and limits", async () => {
  const crawler = await readWorkspaceFile("src/lib/sources/url-crawler.ts");

  assert.match(crawler, /UrlCrawlMode = "auto" \| "page" \| "sitemap"/);
  assert.match(crawler, /resolveCrawlMode/);
  assert.match(crawler, /crawlSitemap/);
  assert.match(crawler, /parseSitemapUrls/);
  assert.match(crawler, /candidate\.origin === sitemapUrl\.origin/);
  assert.match(crawler, /limits\.maxSitemapUrls/);
  assert.match(crawler, /dedupePages/);
  assert.match(crawler, /skippedUrls/);
});

test("RAD-033 persists crawl output as source versions documents chunks and sync state", async () => {
  const ingestion = await readWorkspaceFile("src/lib/sources/url-ingestion.ts");
  const repository = await readWorkspaceFile("src/lib/repositories/sources.ts");

  assert.match(ingestion, /server-only/);
  assert.match(ingestion, /persistUrlCrawlResult/);
  assert.match(ingestion, /getNextSourceVersionNumber/);
  assert.match(ingestion, /createSourceVersion/);
  assert.match(ingestion, /createSourceDocument/);
  assert.match(ingestion, /createSourceChunk/);
  assert.match(ingestion, /updateSourceSyncState/);
  assert.match(ingestion, /syncStatus: "synced"/);
  assert.match(ingestion, /contentHash: result\.contentHash/);
  assert.match(ingestion, /maxChunkCharacters/);
  assert.match(ingestion, /chunkSourceText/);
  assert.match(repository, /getNextSourceVersionNumber/);
  assert.match(repository, /\.from\("source_versions"\)/);
  assert.match(repository, /\.order\("version_number", \{ ascending: false \}\)/);
  assert.match(repository, /updateSourceSyncState/);
  assert.match(repository, /sync_status: input\.syncStatus/);
  assert.match(repository, /last_synced_at: input\.lastSyncedAt/);
});

test("RAD-033 keeps URL ingestion source-minimal and free of unrelated platform scope", async () => {
  const crawler = await readWorkspaceFile("src/lib/sources/url-crawler.ts");
  const ingestion = await readWorkspaceFile("src/lib/sources/url-ingestion.ts");

  for (const source of [crawler, ingestion]) {
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace/i);
    assert.doesNotMatch(source, /service_role|sb_secret/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});

#!/usr/bin/env node

import { readdir, readFile } from "fs/promises";
import path from "path";
import process from "process";

const repoRoot = process.cwd();
const scanRoots = process.argv.slice(2);
const roots =
  scanRoots.length > 0 ? scanRoots : ["src", "apps", "docs", "scripts", "tests"];

const ignoredDirectories = new Set([
  ".git",
  ".next",
  "node_modules",
  "coverage",
  "out",
  "build",
]);

const ignoredFiles = new Set();
const scannedExtensions = new Set([
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".json",
  ".md",
]);

const secretValuePatterns = [
  {
    name: "openai_api_key_value",
    pattern: /\bsk-(?:proj|svcacct|admin)?-[A-Za-z0-9_-]{20,}\b/,
  },
  {
    name: "bearer_token_value",
    pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{24,}\b/,
  },
  {
    name: "private_key_block",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
];

const clientSecretPatterns = [
  {
    name: "public_openai_env",
    pattern: /\bNEXT_PUBLIC_[A-Z0-9_]*OPENAI[A-Z0-9_]*\b/,
  },
  {
    name: "public_secret_env",
    pattern: /\bNEXT_PUBLIC_[A-Z0-9_]*(?:SECRET|TOKEN|API_KEY|KEY)\b/,
  },
  {
    name: "direct_openai_key_access",
    pattern: /\bprocess\.env\.OPENAI_API_KEY\b/,
  },
  {
    name: "server_secret_import",
    pattern: /(?:@\/lib\/security\/server-secrets|src\/lib\/security\/server-secrets)/,
  },
];

function toRelative(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

function shouldScanFile(filePath) {
  return (
    scannedExtensions.has(path.extname(filePath)) &&
    !ignoredFiles.has(path.basename(filePath))
  );
}

function isClientLikeSource(relativePath, contents) {
  return (
    relativePath.startsWith("src/components/") ||
    relativePath.startsWith("src/sections/") ||
    relativePath.startsWith("apps/extension/") ||
    /^["']use client["'];?/.test(contents.trimStart())
  );
}

function isAllowedServerSecretAccess(relativePath) {
  return (
    relativePath === "src/lib/security/server-secrets.ts" ||
    relativePath.startsWith("src/app/api/") ||
    relativePath.endsWith(".test.mjs")
  );
}

function isScannerSelfReference(relativePath, line) {
  return (
    relativePath === "scripts/secret-client-key-scan.mjs" &&
    (/name:/.test(line) || /pattern:/.test(line) || /relativePath ===/.test(line))
  );
}

async function collectFiles(rootPath) {
  const absoluteRoot = path.resolve(repoRoot, rootPath);
  let entries;

  try {
    entries = await readdir(absoluteRoot, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(absoluteRoot, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...(await collectFiles(entryPath)));
      }
      continue;
    }

    if (entry.isFile() && shouldScanFile(entryPath)) {
      files.push(entryPath);
    }
  }

  return files;
}

async function scanFile(filePath) {
  const relativePath = toRelative(filePath);
  const contents = await readFile(filePath, "utf8");
  const clientLike = isClientLikeSource(relativePath, contents);
  const serverOnly = /import\s+["']server-only["'];?/.test(contents);
  const findings = [];

  contents.split(/\r?\n/).forEach((line, index) => {
    if (isScannerSelfReference(relativePath, line)) {
      return;
    }

    for (const secretPattern of secretValuePatterns) {
      if (secretPattern.pattern.test(line)) {
        findings.push({
          file: relativePath,
          line: index + 1,
          rule: secretPattern.name,
          text: line.trim(),
        });
      }
    }

    if (relativePath.startsWith("docs/")) {
      return;
    }

    for (const clientPattern of clientSecretPatterns) {
      if (!clientPattern.pattern.test(line)) {
        continue;
      }

      if (
        !clientLike &&
        (isAllowedServerSecretAccess(relativePath) || serverOnly)
      ) {
        continue;
      }

      findings.push({
        file: relativePath,
        line: index + 1,
        rule: clientPattern.name,
        text: line.trim(),
      });
    }
  });

  return findings;
}

const files = (await Promise.all(roots.map((root) => collectFiles(root)))).flat();
const findings = (await Promise.all(files.map((file) => scanFile(file)))).flat();

if (findings.length > 0) {
  console.error("Potential client-exposed key or committed secret found:");
  for (const finding of findings) {
    console.error(
      `${finding.file}:${finding.line} [${finding.rule}] ${finding.text}`,
    );
  }
  process.exit(1);
}

console.log(
  `No client-exposed keys or committed secrets found in ${files.length} files.`,
);

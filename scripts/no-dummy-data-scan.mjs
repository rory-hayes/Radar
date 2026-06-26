#!/usr/bin/env node

import { readdir, readFile } from "fs/promises";
import path from "path";
import process from "process";

const repoRoot = process.cwd();
const roots = process.argv.slice(2);
const scanRoots = roots.length > 0 ? roots : ["src"];

const ignoredDirectories = new Set([
  ".git",
  ".next",
  "node_modules",
  "coverage",
  "out",
  "build",
]);

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

const terms = [
  { name: "lorem", pattern: /\blorem(?:\s+ipsum)?\b/i },
  { name: "mock", pattern: /\bmock(?:ed|s)?\b/i },
  { name: "dummy", pattern: /\bdummy\b/i },
  { name: "fake", pattern: /\bfake\b/i },
  { name: "sampleData", pattern: /\bsampleData\b/ },
  { name: "placeholder", pattern: /\bplaceholder\b/i },
  { name: "hardcoded", pattern: /\bhardcoded\b/i },
  { name: "Acme", pattern: /\bAcme\b/ },
  { name: "Globex", pattern: /\bGlobex\b/ },
];

function toRelative(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

function shouldScanFile(filePath) {
  return scannedExtensions.has(path.extname(filePath));
}

function isAllowedMatch(termName, line) {
  if (termName === "placeholder") {
    return /\bplaceholder\s*=/.test(line) || /\bplaceholder:/.test(line);
  }

  return false;
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
  const contents = await readFile(filePath, "utf8");
  const findings = [];
  const lines = contents.split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const term of terms) {
      if (term.pattern.test(line) && !isAllowedMatch(term.name, line)) {
        findings.push({
          file: toRelative(filePath),
          line: index + 1,
          term: term.name,
          text: line.trim(),
        });
      }
    }
  });

  return findings;
}

const files = (
  await Promise.all(scanRoots.map((root) => collectFiles(root)))
).flat();
const findings = (await Promise.all(files.map((file) => scanFile(file)))).flat();

if (findings.length > 0) {
  console.error("Dummy or placeholder production data markers found:");
  for (const finding of findings) {
    console.error(
      `${finding.file}:${finding.line} [${finding.term}] ${finding.text}`,
    );
  }
  process.exit(1);
}

console.log(
  `No dummy production data markers found in ${files.length} scanned files.`,
);

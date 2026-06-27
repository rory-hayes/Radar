#!/usr/bin/env node

import { mkdir, rm } from "fs/promises";
import { spawnSync } from "child_process";
import path from "path";
import process from "process";

const repoRoot = process.cwd();
const extensionDir = path.join(repoRoot, "apps", "extension");
const outputDir = path.join(repoRoot, ".extension-build");
const outputFile = path.join(outputDir, "radar-live-assist-extension.zip");

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const result = spawnSync(
  "zip",
  [
    "-qr",
    outputFile,
    "manifest.json",
    "README.md",
    "src/background.js",
    "src/content.css",
    "src/content.js",
    "src/offscreen.html",
    "src/offscreen.js",
    "src/popup.css",
    "src/popup.html",
    "src/popup.js",
  ],
  {
    cwd: extensionDir,
    stdio: "inherit",
  },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(outputFile);

#!/usr/bin/env node

import { spawnSync } from "child_process";
import path from "path";
import process from "process";

const commands = [
  {
    label: "typecheck",
    command: path.join("node_modules", ".bin", "tsc"),
    args: ["--noEmit"],
  },
  {
    label: "no-dummy-data scan",
    command: process.execPath,
    args: ["scripts/no-dummy-data-scan.mjs", "src"],
  },
  {
    label: "secret/client-key scan",
    command: process.execPath,
    args: ["scripts/secret-client-key-scan.mjs"],
  },
  {
    label: "security contract tests",
    command: process.execPath,
    args: ["--test", "tests/security/*.test.mjs"],
  },
];

for (const step of commands) {
  console.log(`\n> ${step.label}`);
  const result = spawnSync(step.command, step.args, {
    cwd: process.cwd(),
    env: process.env,
    shell: false,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

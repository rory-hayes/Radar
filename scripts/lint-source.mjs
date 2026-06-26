import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { globSync } from "node:fs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

const sourceFiles = globSync("**/*.{js,jsx,ts,tsx,mjs,cjs,json,md}", {
  cwd: root,
  exclude: [
    "node_modules/**",
    ".next/**",
    "coverage/**",
    "public/**",
    "src/assets/**",
  ],
});

const blockedProductionTerms = [
  "lorem",
  "sampleData",
  "hardcoded",
  "Acme",
  "Globex",
];

const allowedTermFiles = new Set([
  "IMPLEMENTATION_PLAN.md",
  "scripts/lint-source.mjs",
  "scripts/no-dummy-data-scan.mjs",
]);

const clientSecretPattern = /OPENAI_API_KEY\s*=/;
const clientPaths = [
  "src/components/",
  "src/sections/",
  "src/app/(routes)/",
  "apps/extension/",
];

const failures = [];

for (const file of sourceFiles) {
  const absolute = resolve(root, file);
  const text = readFileSync(absolute, "utf8");
  const normalized = relative(root, absolute);

  if (!allowedTermFiles.has(normalized)) {
    for (const term of blockedProductionTerms) {
      if (text.includes(term)) {
        failures.push(`${normalized}: contains blocked production-data term "${term}"`);
      }
    }
  }

  if (clientPaths.some((prefix) => normalized.startsWith(prefix)) && clientSecretPattern.test(text)) {
    failures.push(`${normalized}: references OPENAI_API_KEY in a browser/client path`);
  }
}

if (failures.length > 0) {
  console.error("Radar source lint failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Radar source lint passed (${sourceFiles.length} files scanned).`);

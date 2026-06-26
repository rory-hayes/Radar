import { existsSync, statSync } from "node:fs";
import { resolve as resolvePath } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = resolvePath(fileURLToPath(new URL("..", import.meta.url)));

function resolveExisting(specifierPath) {
  const candidates = [
    `${specifierPath}.ts`,
    `${specifierPath}.tsx`,
    `${specifierPath}.js`,
    `${specifierPath}.mjs`,
    resolvePath(specifierPath, "index.ts"),
    resolvePath(specifierPath, "index.tsx"),
    resolvePath(specifierPath, "index.js"),
    specifierPath,
  ];

  return candidates.find((candidate) => {
    if (!existsSync(candidate)) {
      return false;
    }

    return statSync(candidate).isFile();
  });
}

export async function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith("@/")) {
    const resolved = resolveExisting(resolvePath(root, "src", specifier.slice(2)));
    if (resolved) {
      return {
        shortCircuit: true,
        url: pathToFileURL(resolved).href,
      };
    }
  }

  if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
    const parentPath = fileURLToPath(new URL(".", context.parentURL));
    const resolved = resolveExisting(resolvePath(parentPath, specifier));
    if (resolved) {
      return {
        shortCircuit: true,
        url: pathToFileURL(resolved).href,
      };
    }
  }

  return defaultResolve(specifier, context, defaultResolve);
}

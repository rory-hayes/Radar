import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function fileExists(relativePath) {
  await access(relativePath);
  return true;
}

test("RAD-003 initializes shadcn with the expected src-based aliases", async () => {
  const componentsConfig = JSON.parse(await readFile("components.json", "utf8"));

  assert.equal(componentsConfig.style, "radix-nova");
  assert.equal(componentsConfig.rsc, true);
  assert.equal(componentsConfig.tsx, true);
  assert.equal(componentsConfig.iconLibrary, "lucide");
  assert.deepEqual(componentsConfig.aliases, {
    components: "@/components",
    utils: "@/lib/utils",
    ui: "@/components/ui",
    lib: "@/lib",
    hooks: "@/hooks",
  });
  assert.equal(componentsConfig.tailwind.css, "src/app/globals.css");
});

test("RAD-003 installs the approved core shadcn primitives", async () => {
  const primitives = [
    "alert",
    "avatar",
    "badge",
    "breadcrumb",
    "button",
    "card",
    "dialog",
    "dropdown-menu",
    "field",
    "input",
    "label",
    "popover",
    "progress",
    "select",
    "separator",
    "sheet",
    "sidebar",
    "skeleton",
    "sonner",
    "table",
    "tabs",
    "textarea",
    "tooltip",
  ];

  await Promise.all(primitives.map((primitive) => fileExists(`src/components/ui/${primitive}.tsx`)));
  await fileExists("src/hooks/use-mobile.ts");
  await fileExists("src/lib/utils.ts");
});

test("RAD-003 configures Tailwind and form utility dependencies", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const globalsCss = await readFile("src/app/globals.css", "utf8");

  for (const dependency of [
    "@hookform/resolvers",
    "class-variance-authority",
    "clsx",
    "lucide-react",
    "react-hook-form",
    "tailwind-merge",
    "zod",
  ]) {
    assert.ok(packageJson.dependencies[dependency], `${dependency} should be installed`);
  }

  assert.ok(packageJson.devDependencies.tailwindcss, "tailwindcss should be installed");
  assert.ok(packageJson.devDependencies["@tailwindcss/postcss"], "@tailwindcss/postcss should be installed");
  assert.match(globalsCss, /@import "tailwindcss";/);
  assert.match(globalsCss, /@theme inline/);
  assert.match(globalsCss, /--color-background: var\(--background\);/);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const productContractSource = await readFile("src/lib/product-contract.ts", "utf8");

test("Radar locks the four allowed core pages", () => {
  const pageBlock = productContractSource.match(/export const corePages = \[([\s\S]*?)\] as const;/);
  assert.ok(pageBlock, "corePages export should exist");

  const pageNames = [...pageBlock[1].matchAll(/name: "([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(pageNames, ["Command Center", "Assertions", "Findings", "Sources"]);
});

test("Radar recognizes the approved runner triad", () => {
  const runnerBlock = productContractSource.match(/export const runnerTypes = \[([\s\S]*?)\] as const;/);
  assert.ok(runnerBlock, "runnerTypes export should exist");

  const runnerNames = [...runnerBlock[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(runnerNames, ["Knowledge Runner", "Journey Runner", "Integration Runner"]);
});

test("Radar explicitly keeps generic eval scope out of the baseline", () => {
  assert.match(productContractSource, /Generic AI eval dashboard/);
  assert.match(productContractSource, /Prompt playground/);
  assert.match(productContractSource, /Integration marketplace/);
});

test("Radar exposes a typed core-page guard for later tickets", () => {
  assert.match(productContractSource, /export function isCorePageName/);
  assert.match(productContractSource, /page.name === pageName/);
});

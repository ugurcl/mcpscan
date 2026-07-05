import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { scanTarget } from "../src/scan.js";
import { Target } from "../src/types.js";

const here = dirname(fileURLToPath(import.meta.url));

function load(name: string): Target {
  return JSON.parse(readFileSync(join(here, "..", "fixtures", name), "utf8"));
}

test("flags the poisoned instruction override", () => {
  const result = scanTarget(load("vulnerable-tools.json"));
  assert.ok(result.findings.some((f) => f.checkId === "tool-poisoning/ignore-previous"));
});

test("flags concealment and exfiltration directives", () => {
  const result = scanTarget(load("vulnerable-tools.json"));
  assert.ok(result.findings.some((f) => f.checkId === "tool-poisoning/hidden-directive"));
  assert.ok(result.findings.some((f) => f.checkId === "tool-poisoning/exfil-destination"));
});

test("flags shell and secret capabilities", () => {
  const result = scanTarget(load("vulnerable-tools.json"));
  assert.ok(result.findings.some((f) => f.checkId === "capability-exposure/shell-exec"));
  assert.ok(result.findings.some((f) => f.checkId === "capability-exposure/secret-access"));
});

test("vulnerable server scores low", () => {
  const result = scanTarget(load("vulnerable-tools.json"));
  assert.ok(result.score < 50, `expected low score, got ${result.score}`);
});

test("flags injection in a resource description", () => {
  const result = scanTarget(load("vulnerable-surfaces.json"));
  const f = result.findings.find((x) => x.checkId === "tool-poisoning/disregard");
  assert.ok(f, "expected a disregard finding");
  assert.match(f!.target, /resource description/);
});

test("flags injection in a prompt argument", () => {
  const result = scanTarget(load("vulnerable-surfaces.json"));
  const f = result.findings.find((x) => x.checkId === "tool-poisoning/ignore-previous");
  assert.ok(f, "expected an ignore-previous finding");
  assert.match(f!.target, /prompt arg/);
});

test("clean server produces no critical or high findings", () => {
  const result = scanTarget(load("clean-tools.json"));
  const serious = result.findings.filter((f) => f.severity === "critical" || f.severity === "high");
  assert.deepEqual(serious, [], `unexpected serious findings: ${JSON.stringify(serious)}`);
});

test("clean server scores high", () => {
  const result = scanTarget(load("clean-tools.json"));
  assert.ok(result.score >= 90, `expected high score, got ${result.score}`);
});

import { readFileSync, writeFileSync } from "node:fs";
import { Finding, Target } from "./types.js";
import { textFields } from "./surfaces.js";

export function saveBaseline(target: Target, path: string): void {
  writeFileSync(path, JSON.stringify(target, null, 2));
}

export function loadBaseline(path: string): Target {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function diffFindings(baseline: Target, current: Target): Finding[] {
  const before = new Map(textFields(baseline).map((f) => [f.subject, f.text]));
  const after = new Map(textFields(current).map((f) => [f.subject, f.text]));
  const findings: Finding[] = [];

  for (const [subject, text] of after) {
    if (!before.has(subject)) {
      findings.push({
        checkId: "drift/added",
        severity: "medium",
        target: subject,
        message: "New metadata surface not present in the trusted baseline; review before granting trust.",
      });
    } else if (before.get(subject) !== text) {
      findings.push({
        checkId: "drift/changed",
        severity: "high",
        target: subject,
        message: "Metadata changed since the trusted baseline; a silent change to a server you already trust is a rug-pull signal.",
        evidence: `was: ${clip(before.get(subject)!)}`,
      });
    }
  }

  for (const subject of before.keys()) {
    if (!after.has(subject)) {
      findings.push({
        checkId: "drift/removed",
        severity: "low",
        target: subject,
        message: "Metadata surface present in the baseline is now gone.",
      });
    }
  }

  return findings;
}

function clip(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > 80 ? flat.slice(0, 80) + "..." : flat;
}

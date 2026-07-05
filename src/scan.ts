import { CHECKS } from "./checks/index.js";
import { Finding, ScanResult, Severity, SEVERITY_ORDER, SEVERITY_WEIGHT, Target } from "./types.js";

export function summarize(findings: Finding[]): ScanResult {
  const sorted = [...findings].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  );
  const counts = Object.fromEntries(SEVERITY_ORDER.map((s) => [s, 0])) as Record<Severity, number>;
  let penalty = 0;
  for (const f of sorted) {
    counts[f.severity] += 1;
    penalty += SEVERITY_WEIGHT[f.severity];
  }
  return { findings: sorted, score: Math.max(0, 100 - penalty), counts };
}

export function collectFindings(target: Target): Finding[] {
  const findings: Finding[] = [];
  for (const check of CHECKS) {
    findings.push(...check.run(target));
  }
  return findings;
}

export function scanTarget(target: Target): ScanResult {
  return summarize(collectFindings(target));
}

import { CHECKS } from "./checks/index.js";
import { Finding, ScanResult, Severity, SEVERITY_ORDER, SEVERITY_WEIGHT, Target } from "./types.js";

export function scanTarget(target: Target): ScanResult {
  const findings: Finding[] = [];
  for (const check of CHECKS) {
    findings.push(...check.run(target));
  }
  findings.sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));

  const counts = Object.fromEntries(SEVERITY_ORDER.map((s) => [s, 0])) as Record<Severity, number>;
  let penalty = 0;
  for (const f of findings) {
    counts[f.severity] += 1;
    penalty += SEVERITY_WEIGHT[f.severity];
  }
  const score = Math.max(0, 100 - penalty);
  return { findings, score, counts };
}

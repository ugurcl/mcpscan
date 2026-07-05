import { ScanResult, Severity, SEVERITY_ORDER } from "./types.js";

const LABEL: Record<Severity, string> = {
  critical: "CRIT",
  high: "HIGH",
  medium: "MED",
  low: "LOW",
  info: "INFO",
};

export function formatText(result: ScanResult, targetName: string): string {
  const lines: string[] = [];
  lines.push(`mcpscan report for ${targetName}`);
  lines.push("");
  if (result.findings.length === 0) {
    lines.push("No findings. Score: 100/100");
    return lines.join("\n");
  }
  for (const f of result.findings) {
    lines.push(`[${LABEL[f.severity]}] ${f.target}`);
    lines.push(`  ${f.message}`);
    lines.push(`  check: ${f.checkId}`);
    if (f.evidence) lines.push(`  evidence: ${f.evidence}`);
    lines.push("");
  }
  const summary = SEVERITY_ORDER.filter((s) => result.counts[s] > 0)
    .map((s) => `${result.counts[s]} ${s}`)
    .join(", ");
  lines.push(`Findings: ${summary}`);
  lines.push(`Score: ${result.score}/100`);
  return lines.join("\n");
}

export function formatJson(result: ScanResult, targetName: string): string {
  return JSON.stringify({ target: targetName, ...result }, null, 2);
}

export function worstSeverity(result: ScanResult): Severity | null {
  for (const s of SEVERITY_ORDER) {
    if (result.counts[s] > 0) return s;
  }
  return null;
}

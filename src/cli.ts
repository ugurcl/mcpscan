#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { collectFindings, summarize } from "./scan.js";
import { fetchTargetOverStdio } from "./client.js";
import { saveBaseline, loadBaseline, diffFindings } from "./baseline.js";
import { formatText, formatJson, worstSeverity } from "./report.js";
import { Severity, Target } from "./types.js";

const FAIL_ON: Severity[] = ["critical", "high"];

interface Options {
  cmd?: string;
  file?: string;
  json: boolean;
  saveBaseline?: string;
  baseline?: string;
}

function usage(): never {
  console.error("Usage:");
  console.error("  mcpscan --cmd \"<command to launch the MCP server>\" [--json]");
  console.error("  mcpscan --file <tools.json> [--json]");
  console.error("  mcpscan --cmd \"...\" --save-baseline <file>   save a trusted snapshot");
  console.error("  mcpscan --cmd \"...\" --baseline <file>        also flag drift from the snapshot");
  process.exit(2);
}

function parseArgs(argv: string[]): Options {
  const opts: Options = { json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") opts.json = true;
    else if (a === "--cmd") opts.cmd = argv[++i];
    else if (a === "--file") opts.file = argv[++i];
    else if (a === "--save-baseline") opts.saveBaseline = argv[++i];
    else if (a === "--baseline") opts.baseline = argv[++i];
    else usage();
  }
  return opts;
}

async function loadTarget(opts: Options): Promise<{ target: Target; name: string }> {
  if (opts.file) {
    return { target: JSON.parse(readFileSync(opts.file, "utf8")), name: opts.file };
  }
  if (opts.cmd) {
    const parts = opts.cmd.trim().split(/\s+/);
    const target = await fetchTargetOverStdio(parts[0], parts.slice(1));
    return { target, name: opts.cmd };
  }
  usage();
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { target, name } = await loadTarget(opts);

  if (opts.saveBaseline) {
    saveBaseline(target, opts.saveBaseline);
    console.error(`Baseline saved to ${opts.saveBaseline}`);
    return;
  }

  const findings = collectFindings(target);
  if (opts.baseline) {
    findings.push(...diffFindings(loadBaseline(opts.baseline), target));
  }
  const result = summarize(findings);

  console.log(opts.json ? formatJson(result, name) : formatText(result, name));
  const worst = worstSeverity(result);
  if (worst && FAIL_ON.includes(worst)) process.exit(1);
}

main().catch((err) => {
  console.error(`mcpscan error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(2);
});

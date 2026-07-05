import { readFileSync } from "node:fs";
import { scanTarget } from "./scan.js";
import { fetchTargetOverStdio } from "./client.js";
import { formatText, formatJson, worstSeverity } from "./report.js";
import { Severity, Target } from "./types.js";

const FAIL_ON: Severity[] = ["critical", "high"];

function usage(): never {
  console.error("Usage:");
  console.error("  mcpscan --cmd \"<command to launch the MCP server>\" [--json]");
  console.error("  mcpscan --file <tools.json> [--json]");
  process.exit(2);
}

function parseArgs(argv: string[]) {
  const opts: { cmd?: string; file?: string; json: boolean } = { json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") opts.json = true;
    else if (a === "--cmd") opts.cmd = argv[++i];
    else if (a === "--file") opts.file = argv[++i];
    else usage();
  }
  return opts;
}

async function loadTarget(opts: { cmd?: string; file?: string }): Promise<{ target: Target; name: string }> {
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
  const result = scanTarget(target);
  console.log(opts.json ? formatJson(result, name) : formatText(result, name));
  const worst = worstSeverity(result);
  if (worst && FAIL_ON.includes(worst)) process.exit(1);
}

main().catch((err) => {
  console.error(`mcpscan error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(2);
});

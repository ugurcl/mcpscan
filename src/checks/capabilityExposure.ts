import { Check, Finding, Severity, ToolInfo } from "../types.js";

interface CapRule {
  id: string;
  severity: Severity;
  label: string;
  regex: RegExp;
}

const CAP_RULES: CapRule[] = [
  { id: "shell-exec", severity: "high", label: "arbitrary command execution", regex: /\b(exec|execute|run[_\s-]?command|shell|subprocess|spawn|bash|sh|cmd|powershell|eval)\b/i },
  { id: "file-write", severity: "medium", label: "filesystem write or delete", regex: /\b(write[_\s-]?file|delete[_\s-]?file|remove[_\s-]?file|unlink|rmdir|overwrite|save[_\s-]?file)\b/i },
  { id: "file-read", severity: "low", label: "filesystem read", regex: /\b(read[_\s-]?file|open[_\s-]?file|cat[_\s-]?file|load[_\s-]?file|list[_\s-]?dir|readdir)\b/i },
  { id: "network", severity: "low", label: "outbound network access", regex: /\b(fetch|http[_\s-]?request|curl|download|upload|webhook|send[_\s-]?request)\b/i },
  { id: "secret-access", severity: "high", label: "secret or credential access", regex: /\b(env|environment|secret|credential|token|api[_\s-]?key|password|private[_\s-]?key)\b/i },
];

function haystack(tool: ToolInfo): string {
  const parts: string[] = [tool.name];
  if (tool.description) parts.push(tool.description);
  const schema = tool.inputSchema as { properties?: Record<string, unknown> } | undefined;
  if (schema?.properties) parts.push(Object.keys(schema.properties).join(" "));
  return parts.join(" ");
}

export const capabilityExposure: Check = {
  id: "capability-exposure",
  title: "Over-broad or sensitive capabilities",
  run(target): Finding[] {
    const findings: Finding[] = [];
    for (const tool of target.tools) {
      const text = haystack(tool);
      for (const rule of CAP_RULES) {
        if (rule.regex.test(text)) {
          findings.push({
            checkId: `capability-exposure/${rule.id}`,
            severity: rule.severity,
            target: tool.name,
            message: `Tool appears to expose ${rule.label}; this widens the blast radius if the agent is manipulated.`,
          });
        }
      }
    }
    return findings;
  },
};

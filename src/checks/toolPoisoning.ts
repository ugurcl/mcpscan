import { Check, Finding, Severity, ToolInfo } from "../types.js";

interface Pattern {
  id: string;
  severity: Severity;
  regex: RegExp;
  label: string;
}

const INSTRUCTION_PATTERNS: Pattern[] = [
  { id: "ignore-previous", severity: "critical", regex: /ignore\s+(all\s+|the\s+|any\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|messages?|context)/i, label: "instruction override" },
  { id: "disregard", severity: "critical", regex: /disregard\s+(all\s+|the\s+|any\s+)?(previous|prior|above|earlier|system)/i, label: "instruction override" },
  { id: "system-prompt", severity: "high", regex: /(reveal|print|repeat|output|show)\s+(the\s+|your\s+)?system\s+prompt/i, label: "system prompt extraction" },
  { id: "hidden-directive", severity: "high", regex: /do\s+not\s+(tell|inform|mention|reveal|notify|alert)\s+(the\s+)?(user|human|operator)/i, label: "concealment directive" },
  { id: "must-always", severity: "medium", regex: /you\s+(must|should|have to)\s+(always|never)\b/i, label: "coercive directive" },
  { id: "act-as", severity: "medium", regex: /(you\s+are\s+now|act\s+as|pretend\s+to\s+be|from\s+now\s+on)\b/i, label: "role reassignment" },
  { id: "exfil-directive", severity: "high", regex: /\b(send|email|post|upload|forward|exfiltrate|leak)\b[^.]{0,40}\b(secret|token|credential|password|api[_\s-]?key|env|\.env|data)\b/i, label: "exfiltration directive" },
  { id: "exfil-destination", severity: "high", regex: /\b(send|post|upload|forward|exfiltrate|deliver|transmit|report)\b[^.]{0,60}\b(to|at)\b[^.]{0,25}([\w.+-]+@[\w-]+\.[\w.-]+|https?:\/\/)/i, label: "exfiltration to an external destination" },
  { id: "tool-chaining", severity: "medium", regex: /(then\s+call|always\s+call|also\s+call|silently\s+(call|use|invoke))\b/i, label: "covert tool chaining" },
];

const ZERO_WIDTH = /[​-‏﻿⁠]/;
const BIDI_CONTROL = /[‪-‮⁦-⁩]/;
const TAG_CHARS = /[\u{E0000}-\u{E007F}]/u;

function fieldsOf(tool: ToolInfo): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  if (tool.description) out.push({ where: "description", text: tool.description });
  const schema = tool.inputSchema as { properties?: Record<string, { description?: string }> } | undefined;
  const props = schema?.properties;
  if (props) {
    for (const [key, val] of Object.entries(props)) {
      if (val && typeof val.description === "string") {
        out.push({ where: `param:${key}`, text: val.description });
      }
    }
  }
  return out;
}

function snippet(text: string, index: number): string {
  const start = Math.max(0, index - 20);
  const end = Math.min(text.length, index + 60);
  return (start > 0 ? "..." : "") + text.slice(start, end).replace(/\s+/g, " ").trim() + (end < text.length ? "..." : "");
}

export const toolPoisoning: Check = {
  id: "tool-poisoning",
  title: "Hidden instructions and injection in tool metadata",
  run(target): Finding[] {
    const findings: Finding[] = [];
    for (const tool of target.tools) {
      for (const field of fieldsOf(tool)) {
        for (const pat of INSTRUCTION_PATTERNS) {
          const m = pat.regex.exec(field.text);
          if (m) {
            findings.push({
              checkId: `tool-poisoning/${pat.id}`,
              severity: pat.severity,
              target: `${tool.name} (${field.where})`,
              message: `Possible ${pat.label} embedded in tool metadata; an agent reading this may follow it.`,
              evidence: snippet(field.text, m.index),
            });
          }
        }
        if (ZERO_WIDTH.test(field.text)) {
          findings.push({ checkId: "tool-poisoning/zero-width", severity: "high", target: `${tool.name} (${field.where})`, message: "Zero-width or invisible characters found; often used to hide instructions from human review." });
        }
        if (BIDI_CONTROL.test(field.text)) {
          findings.push({ checkId: "tool-poisoning/bidi", severity: "high", target: `${tool.name} (${field.where})`, message: "Bidirectional control characters found; text may render differently than it is read by the model." });
        }
        if (TAG_CHARS.test(field.text)) {
          findings.push({ checkId: "tool-poisoning/tag-chars", severity: "high", target: `${tool.name} (${field.where})`, message: "Unicode tag characters found; a known channel for smuggling hidden instructions." });
        }
      }
    }
    return findings;
  },
};

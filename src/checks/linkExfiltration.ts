import { Check, Finding, Severity } from "../types.js";
import { textFields } from "../surfaces.js";

const MARKDOWN_IMAGE = /!\[[^\]]*\]\((https?:\/\/[^)]+)\)/gi;
const MARKDOWN_LINK = /(?<!!)\[[^\]]*\]\((https?:\/\/[^)]+)\)/gi;
const RAW_URL = /https?:\/\/[^\s)"'<>]+/gi;

const IP_HOST = /^https?:\/\/(\d{1,3}\.){3}\d{1,3}(:\d+)?/i;
const DATA_CARRIER = /[?&](data|q|c|content|text|payload|prompt|token|secret)=|[{}$]|%7B|\{\{/i;

function carries(url: string): boolean {
  return DATA_CARRIER.test(url);
}

function evidence(url: string): string {
  return url.length > 90 ? url.slice(0, 90) + "..." : url;
}

export const linkExfiltration: Check = {
  id: "link-exfiltration",
  title: "Data exfiltration through embedded links and images",
  run(target): Finding[] {
    const findings: Finding[] = [];
    for (const field of textFields(target)) {
      const seen = new Set<string>();

      for (const m of field.text.matchAll(MARKDOWN_IMAGE)) {
        const url = m[1];
        seen.add(url);
        const sev: Severity = carries(url) ? "critical" : "high";
        findings.push({
          checkId: "link-exfiltration/markdown-image",
          severity: sev,
          target: field.subject,
          message: "Markdown image with a remote URL; clients that render it will fetch the URL automatically, and a data-carrying URL leaks whatever is interpolated into it.",
          evidence: evidence(url),
        });
      }

      for (const m of field.text.matchAll(MARKDOWN_LINK)) {
        const url = m[1];
        if (seen.has(url) || !carries(url)) continue;
        seen.add(url);
        findings.push({
          checkId: "link-exfiltration/markdown-link",
          severity: "high",
          target: field.subject,
          message: "Markdown link whose URL carries a data parameter or template placeholder; a plausible exfiltration channel.",
          evidence: evidence(url),
        });
      }

      for (const m of field.text.matchAll(RAW_URL)) {
        const url = m[0];
        if (seen.has(url)) continue;
        if (carries(url)) {
          seen.add(url);
          findings.push({
            checkId: "link-exfiltration/data-url",
            severity: "high",
            target: field.subject,
            message: "URL carries a data parameter or template placeholder; if an agent fills it in, the value is sent to the host.",
            evidence: evidence(url),
          });
        } else if (IP_HOST.test(url)) {
          seen.add(url);
          findings.push({
            checkId: "link-exfiltration/ip-url",
            severity: "medium",
            target: field.subject,
            message: "URL points directly at an IP address rather than a named host; unusual for legitimate documentation.",
            evidence: evidence(url),
          });
        }
      }
    }
    return findings;
  },
};

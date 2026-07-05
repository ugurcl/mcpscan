export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface ToolInfo {
  name: string;
  description?: string;
  inputSchema?: unknown;
}

export interface ResourceInfo {
  name: string;
  uri?: string;
  description?: string;
}

export interface PromptArg {
  name: string;
  description?: string;
}

export interface PromptInfo {
  name: string;
  description?: string;
  arguments?: PromptArg[];
}

export interface Target {
  tools: ToolInfo[];
  resources?: ResourceInfo[];
  prompts?: PromptInfo[];
}

export interface TextField {
  subject: string;
  text: string;
}

export interface Finding {
  checkId: string;
  severity: Severity;
  target: string;
  message: string;
  evidence?: string;
}

export interface Check {
  id: string;
  title: string;
  run(target: Target): Finding[];
}

export interface ScanResult {
  findings: Finding[];
  score: number;
  counts: Record<Severity, number>;
}

export const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low", "info"];

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 40,
  high: 20,
  medium: 8,
  low: 3,
  info: 0,
};

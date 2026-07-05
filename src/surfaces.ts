import { Target, TextField } from "./types.js";

export function textFields(target: Target): TextField[] {
  const out: TextField[] = [];

  for (const tool of target.tools) {
    if (tool.description) out.push({ subject: `${tool.name} (tool description)`, text: tool.description });
    const schema = tool.inputSchema as { properties?: Record<string, { description?: string }> } | undefined;
    if (schema?.properties) {
      for (const [key, val] of Object.entries(schema.properties)) {
        if (val && typeof val.description === "string") {
          out.push({ subject: `${tool.name} (tool param: ${key})`, text: val.description });
        }
      }
    }
  }

  for (const res of target.resources ?? []) {
    if (res.description) {
      out.push({ subject: `${res.name || res.uri || "resource"} (resource description)`, text: res.description });
    }
  }

  for (const prompt of target.prompts ?? []) {
    if (prompt.description) {
      out.push({ subject: `${prompt.name} (prompt description)`, text: prompt.description });
    }
    for (const arg of prompt.arguments ?? []) {
      if (arg.description) {
        out.push({ subject: `${prompt.name} (prompt arg: ${arg.name})`, text: arg.description });
      }
    }
  }

  return out;
}

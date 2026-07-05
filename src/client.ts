import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { PromptInfo, ResourceInfo, Target, ToolInfo } from "./types.js";

export async function fetchTargetOverStdio(command: string, args: string[]): Promise<Target> {
  const transport = new StdioClientTransport({ command, args });
  const client = new Client({ name: "mcpscan", version: "0.1.0" }, { capabilities: {} });
  await client.connect(transport);
  try {
    const caps = client.getServerCapabilities() ?? {};

    let tools: ToolInfo[] = [];
    if (caps.tools) {
      const res = await client.listTools();
      tools = res.tools.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }));
    }

    let resources: ResourceInfo[] = [];
    if (caps.resources) {
      const res = await client.listResources();
      resources = res.resources.map((r) => ({ name: r.name, uri: r.uri, description: r.description }));
    }

    let prompts: PromptInfo[] = [];
    if (caps.prompts) {
      const res = await client.listPrompts();
      prompts = res.prompts.map((p) => ({
        name: p.name,
        description: p.description,
        arguments: (p.arguments ?? []).map((a) => ({ name: a.name, description: a.description })),
      }));
    }

    return { tools, resources, prompts };
  } finally {
    await client.close();
  }
}

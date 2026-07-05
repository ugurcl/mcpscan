import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Target, ToolInfo } from "./types.js";

export async function fetchTargetOverStdio(command: string, args: string[]): Promise<Target> {
  const transport = new StdioClientTransport({ command, args });
  const client = new Client({ name: "mcpscan", version: "0.1.0" }, { capabilities: {} });
  await client.connect(transport);
  try {
    const { tools } = await client.listTools();
    const mapped: ToolInfo[] = tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    }));
    return { tools: mapped };
  } finally {
    await client.close();
  }
}

import type { ToolDefinition, ToolResult, ToolSchema } from '../types/index.js';

export class ToolDispatcher {
  private tools = new Map<string, ToolDefinition>();
  private onConfirm?: (message: string) => Promise<boolean>;

  constructor(options?: { onConfirm?: (message: string) => Promise<boolean> }) {
    this.onConfirm = options?.onConfirm;
  }

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  async dispatch(name: string, input: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return { content: `ツール '${name}' は存在しません`, is_error: true };
    }

    if (tool.requiresConfirmation && this.onConfirm) {
      const confirmed = await this.onConfirm(`${name}: ${JSON.stringify(input)}`);
      if (!confirmed) {
        return { content: 'ユーザーが実行を拒否しました', is_error: true };
      }
    }

    try {
      return await tool.handler(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { content: `ツール実行エラー: ${message}`, is_error: true };
    }
  }

  getToolSchemas(): ToolSchema[] {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
    }));
  }

  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }
}

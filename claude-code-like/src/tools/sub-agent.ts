import { AgentLoader } from '../loaders/agent-loader.js';
import { AgentLoop } from '../agent/agent-loop.js';
import { ToolDispatcher } from '../agent/tool-dispatcher.js';
import { createReadTool } from './read.js';
import { createGlobTool } from './glob.js';
import { createGrepTool } from './grep.js';
import { createEditTool } from './edit.js';
import { createWriteTool } from './write.js';
import { createBashTool } from './bash.js';
import type { Provider, ToolDefinition, ToolResult, ConversationContext } from '../types/index.js';

/**
 * サブエージェントに作業を委譲するツール
 * AgentLoader でエージェント定義を取得し、制限付き ToolDispatcher + 独立 messages で新規 AgentLoop を起動する
 */
export function createSubAgentTool(options: {
  provider: Provider;
  agentLoader?: AgentLoader;
  agentDirs?: string[];
  onConfirm?: (message: string) => Promise<boolean>;
}): ToolDefinition {
  const loader = options.agentLoader ?? new AgentLoader();
  const dirs = options.agentDirs ?? ['.agents'];

  return {
    name: 'SubAgent',
    description: 'サブエージェントに作業を委譲します。独立したコンテキストでツール制限付きエージェントを実行します。',
    input_schema: {
      type: 'object' as const,
      properties: {
        agent: { type: 'string', description: 'エージェント名' },
        task: { type: 'string', description: '委譲するタスクの内容' },
      },
      required: ['agent', 'task'],
    },
    handler: async (input): Promise<ToolResult> => {
      const agentName = input.agent as string;
      const task = input.task as string;

      // AgentLoader 内部の loaded フラグで冪等性が保証される
      await loader.loadAgents(dirs);

      const agentDef = loader.resolve(agentName);
      if (!agentDef) {
        const available = loader.listAgents().map((a) => a.name).join(', ');
        return {
          content: `エージェント '${agentName}' が見つかりません${available ? `。利用可能: ${available}` : ''}`,
          is_error: true,
        };
      }

      // 制限付き ToolDispatcher を生成
      const subDispatcher = new ToolDispatcher({ onConfirm: options.onConfirm });

      const toolCreators: Record<string, () => ToolDefinition> = {
        Read: createReadTool,
        Glob: createGlobTool,
        Grep: createGrepTool,
        Edit: createEditTool,
        Write: () => createWriteTool({ onConfirm: options.onConfirm }),
        Bash: () => createBashTool(),
      };

      for (const toolName of agentDef.tools) {
        const creator = toolCreators[toolName];
        if (creator) {
          subDispatcher.register(creator());
        }
      }

      // 独立した会話コンテキスト
      const subContext: ConversationContext = {
        messages: [],
        systemPrompt: agentDef.instructions,
        tools: [],
      };

      const subLoop = new AgentLoop({
        provider: options.provider,
        dispatcher: subDispatcher,
      });

      try {
        const result = await subLoop.run(task, subContext);
        return { content: result || '(サブエージェントは結果を返しませんでした)' };
      } catch (error) {
        return {
          content: `SubAgent エラー: ${(error as Error).message}`,
          is_error: true,
        };
      }
    },
  };
}

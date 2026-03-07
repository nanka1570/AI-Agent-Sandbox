import OpenAI from 'openai';
import type {
  Provider,
  CreateMessageParams,
  LLMResponse,
  ContentBlock,
  MessageParam,
  ToolResultBlockParam,
} from '../types/index.js';
import { isToolResultArray } from '../types/index.js';
import type { ToolSchema } from '../types/tool.js';

function safeJsonParse(json: string | undefined): Record<string, unknown> {
  try {
    return JSON.parse(json || '{}');
  } catch {
    return {};
  }
}

export class OpenAICompatibleProvider implements Provider {
  private client: OpenAI;
  readonly modelId: string;

  constructor(apiKey: string, model: string, baseURL: string) {
    this.client = new OpenAI({ apiKey, baseURL });
    this.modelId = model;
  }

  async createMessage(params: CreateMessageParams): Promise<LLMResponse> {
    const messages = this.convertMessages(params.system, params.messages);
    const tools = this.convertTools(params.tools);

    const response = await this.client.chat.completions.create({
      model: this.modelId,
      max_tokens: params.maxTokens,
      messages,
      ...(tools.length > 0 ? { tools } : {}),
    });

    const choice = response.choices[0];
    if (!choice) {
      return { content: [{ type: 'text', text: '' }], stop_reason: 'end_turn' };
    }

    const content: ContentBlock[] = [];

    if (choice.message.content) {
      content.push({ type: 'text', text: choice.message.content });
    }

    if (choice.message.tool_calls) {
      for (const tc of choice.message.tool_calls) {
        if (tc.type === 'function') {
          content.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.function.name,
            input: safeJsonParse(tc.function.arguments),
          });
        }
      }
    }

    if (content.length === 0) {
      content.push({ type: 'text', text: '' });
    }

    const stopReason = this.mapFinishReason(choice.finish_reason);

    return { content, stop_reason: stopReason };
  }

  private mapFinishReason(reason: string | null): 'end_turn' | 'tool_use' | 'max_tokens' {
    switch (reason) {
      case 'stop':
        return 'end_turn';
      case 'tool_calls':
        return 'tool_use';
      case 'length':
        return 'max_tokens';
      default:
        return 'end_turn';
    }
  }

  private convertMessages(
    system: string,
    messages: MessageParam[],
  ): OpenAI.ChatCompletionMessageParam[] {
    const result: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: system },
    ];

    for (const msg of messages) {
      if (msg.role === 'user') {
        if (typeof msg.content === 'string') {
          result.push({ role: 'user', content: msg.content });
        } else if (Array.isArray(msg.content) && isToolResultArray(msg.content)) {
          // ToolResultBlockParam[] → tool messages
          for (const tr of msg.content as ToolResultBlockParam[]) {
            result.push({
              role: 'tool' as const,
              tool_call_id: tr.tool_use_id,
              content: tr.content,
            });
          }
        } else {
          // ContentBlock[] from user — extract text
          const texts = (msg.content as ContentBlock[])
            .filter((b) => b.type === 'text')
            .map((b) => (b as { type: 'text'; text: string }).text);
          result.push({ role: 'user', content: texts.join('\n') || '' });
        }
      } else if (msg.role === 'assistant') {
        if (typeof msg.content === 'string') {
          result.push({ role: 'assistant', content: msg.content });
        } else {
          const blocks = msg.content as ContentBlock[];
          const textParts = blocks.filter((b) => b.type === 'text').map((b) => (b as { type: 'text'; text: string }).text);
          const toolCalls = blocks
            .filter((b) => b.type === 'tool_use')
            .map((b) => {
              const tu = b as { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> };
              return {
                id: tu.id,
                type: 'function' as const,
                function: {
                  name: tu.name,
                  arguments: JSON.stringify(tu.input),
                },
              };
            });

          result.push({
            role: 'assistant',
            content: textParts.join('\n') || null,
            ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
          });
        }
      }
    }

    return result;
  }

  private convertTools(tools: ToolSchema[]): OpenAI.ChatCompletionTool[] {
    return tools.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description ?? '',
        parameters: tool.input_schema as Record<string, unknown>,
      },
    }));
  }
}

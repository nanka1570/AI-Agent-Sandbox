import { GoogleGenAI } from '@google/genai';
import type { Content, FunctionDeclaration, Part } from '@google/genai';
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

export class GeminiProvider implements Provider {
  private client: GoogleGenAI;
  readonly modelId: string;

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.modelId = model;
  }

  async createMessage(params: CreateMessageParams): Promise<LLMResponse> {
    const contents = this.convertMessages(params.messages);
    const tools = this.convertTools(params.tools);

    const response = await this.client.models.generateContent({
      model: this.modelId,
      contents,
      config: {
        systemInstruction: params.system,
        maxOutputTokens: params.maxTokens,
        ...(tools.length > 0 ? { tools: [{ functionDeclarations: tools }] } : {}),
      },
    });

    const content: ContentBlock[] = [];
    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];

    for (const part of parts) {
      if (part.text) {
        content.push({ type: 'text', text: part.text });
      } else if (part.functionCall?.name) {
        content.push({
          type: 'tool_use',
          id: part.functionCall.id ?? `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: part.functionCall.name,
          input: (part.functionCall.args ?? {}) as Record<string, unknown>,
        });
      }
    }

    if (content.length === 0) {
      content.push({ type: 'text', text: '' });
    }

    const hasToolUse = content.some((b) => b.type === 'tool_use');
    const stopReason = hasToolUse
      ? 'tool_use' as const
      : this.mapFinishReason(candidate?.finishReason as string | undefined);

    return { content, stop_reason: stopReason };
  }

  private mapFinishReason(reason: string | undefined): 'end_turn' | 'tool_use' | 'max_tokens' {
    switch (reason) {
      case 'STOP':
        return 'end_turn';
      case 'MAX_TOKENS':
        return 'max_tokens';
      case 'FUNCTION_CALL':
        return 'tool_use';
      default:
        return 'end_turn';
    }
  }

  private convertMessages(messages: MessageParam[]): Content[] {
    const result: Content[] = [];

    for (const msg of messages) {
      if (msg.role === 'user') {
        if (typeof msg.content === 'string') {
          result.push({ role: 'user', parts: [{ text: msg.content }] });
        } else if (Array.isArray(msg.content) && isToolResultArray(msg.content)) {
          // ToolResultBlockParam[] → functionResponse parts
          // 直前の model メッセージから functionCall の id → name マッピングを構築
          const nameMap = new Map<string, string>();
          const prevMsg = result[result.length - 1];
          if (prevMsg?.parts) {
            for (const p of prevMsg.parts) {
              if (p.functionCall?.id) {
                nameMap.set(p.functionCall.id, p.functionCall.name ?? '');
              }
            }
          }
          const parts: Part[] = [];
          for (const tr of msg.content as ToolResultBlockParam[]) {
            parts.push({
              functionResponse: {
                id: tr.tool_use_id,
                name: nameMap.get(tr.tool_use_id) ?? tr.tool_use_id,
                response: { output: tr.content },
              },
            });
          }
          result.push({ role: 'user', parts });
        } else {
          // ContentBlock[]
          const texts = (msg.content as ContentBlock[])
            .filter((b) => b.type === 'text')
            .map((b) => (b as { type: 'text'; text: string }).text);
          result.push({ role: 'user', parts: [{ text: texts.join('\n') || '' }] });
        }
      } else if (msg.role === 'assistant') {
        if (typeof msg.content === 'string') {
          result.push({ role: 'model', parts: [{ text: msg.content }] });
        } else {
          const parts: Part[] = [];
          for (const block of msg.content as ContentBlock[]) {
            if (block.type === 'text') {
              parts.push({ text: block.text });
            } else if (block.type === 'tool_use') {
              parts.push({
                functionCall: {
                  id: block.id,
                  name: block.name,
                  args: block.input,
                },
              });
            }
          }
          result.push({ role: 'model', parts });
        }
      }
    }

    return result;
  }

  private convertTools(tools: ToolSchema[]): FunctionDeclaration[] {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description ?? '',
      parameters: tool.input_schema as Record<string, unknown>,
    }));
  }
}

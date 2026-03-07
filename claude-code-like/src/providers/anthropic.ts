import Anthropic from '@anthropic-ai/sdk';
import type { Provider, CreateMessageParams, LLMResponse, ContentBlock } from '../types/index.js';

export class AnthropicProvider implements Provider {
  private client: Anthropic;
  readonly modelId: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.modelId = model;
  }

  async createMessage(params: CreateMessageParams): Promise<LLMResponse> {
    const stream = this.client.messages.stream({
      model: this.modelId,
      max_tokens: params.maxTokens,
      system: params.system,
      messages: params.messages as Anthropic.MessageParam[],
      ...(params.tools.length > 0
        ? { tools: params.tools as Anthropic.Messages.Tool[] }
        : {}),
    });

    const response = await stream.finalMessage();

    return {
      content: response.content.map((block): ContentBlock => {
        if (block.type === 'text') {
          return { type: 'text', text: block.text };
        }
        if (block.type === 'tool_use') {
          return {
            type: 'tool_use',
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          };
        }
        return { type: 'text', text: '' };
      }),
      stop_reason: this.mapStopReason(response.stop_reason),
    };
  }

  private mapStopReason(reason: string | null): 'end_turn' | 'tool_use' | 'max_tokens' {
    switch (reason) {
      case 'end_turn':
        return 'end_turn';
      case 'tool_use':
        return 'tool_use';
      case 'max_tokens':
        return 'max_tokens';
      default:
        return 'end_turn';
    }
  }
}

import Anthropic from '@anthropic-ai/sdk';
import type { Provider, CreateMessageParams, MessageStream } from '../types/index.js';

export class AnthropicProvider implements Provider {
  private client: Anthropic;
  readonly modelId: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.modelId = model;
  }

  async createMessage(params: CreateMessageParams): Promise<MessageStream> {
    return this.client.messages.stream({
      model: this.modelId,
      max_tokens: params.maxTokens,
      system: params.system,
      messages: params.messages,
      tools: params.tools as Anthropic.Messages.Tool[],
    });
  }
}

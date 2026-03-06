import type Anthropic from '@anthropic-ai/sdk';
import type { MessageStream as _MessageStream } from '@anthropic-ai/sdk/lib/MessageStream.js';
import type { ToolSchema } from './tool.js';

export type MessageParam = Anthropic.MessageParam;
export type ContentBlock = Anthropic.ContentBlock;
export type ToolUseBlock = Anthropic.ToolUseBlock;
export type ToolResultBlockParam = Anthropic.ToolResultBlockParam;
export type MessageStream = _MessageStream;
export type RawMessageStreamEvent = Anthropic.RawMessageStreamEvent;

export interface CreateMessageParams {
  messages: MessageParam[];
  system: string;
  tools: ToolSchema[];
  maxTokens: number;
}

export interface Provider {
  createMessage(params: CreateMessageParams): Promise<MessageStream>;
  readonly modelId: string;
}

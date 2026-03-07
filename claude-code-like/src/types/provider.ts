import type { ToolSchema } from './tool.js';

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export type ContentBlock = TextBlock | ToolUseBlock;

export interface ToolResultBlockParam {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export interface MessageParam {
  role: 'user' | 'assistant';
  content: string | ContentBlock[] | ToolResultBlockParam[];
}

export interface LLMResponse {
  content: ContentBlock[];
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens';
}

export interface CreateMessageParams {
  messages: MessageParam[];
  system: string;
  tools: ToolSchema[];
  maxTokens: number;
}

export interface Provider {
  createMessage(params: CreateMessageParams): Promise<LLMResponse>;
  readonly modelId: string;
}

export function isToolResultArray(content: unknown[]): content is ToolResultBlockParam[] {
  return content.length > 0 && (content[0] as ToolResultBlockParam).type === 'tool_result';
}

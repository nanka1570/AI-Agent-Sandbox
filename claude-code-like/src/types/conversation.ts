import type { MessageParam } from './provider.js';
import type { ToolDefinition } from './tool.js';

export interface ConversationContext {
  messages: MessageParam[];
  systemPrompt: string;
  /** 将来のツール制限機能のための予約フィールド（MVP では未使用） */
  tools: ToolDefinition[];
}

export interface ConversationRecord {
  id: string;
  summary: string;
  messages: MessageParam[];
  createdAt: string;
  updatedAt: string;
}

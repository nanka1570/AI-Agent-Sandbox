import { describe, it, expect } from 'vitest';
import { AgentLoop } from '../../src/agent/agent-loop.js';
import { ToolDispatcher } from '../../src/agent/tool-dispatcher.js';
import { SystemPromptManager } from '../../src/agent/system-prompt.js';
import { registerAllTools } from '../../src/tools/index.js';
import type { ConversationContext } from '../../src/types/index.js';
import { createMockProvider } from '../helpers/mock-provider.js';

describe('E2E: 基本会話フロー', () => {
  it('ユーザー入力に対してテキスト応答を返す', async () => {
    const provider = createMockProvider([
      { content: [{ type: 'text', text: 'こんにちは！お手伝いします。' }], stop_reason: 'end_turn' },
    ]);

    const dispatcher = new ToolDispatcher();
    registerAllTools(dispatcher);

    const promptManager = new SystemPromptManager();
    const context: ConversationContext = {
      messages: [],
      systemPrompt: promptManager.build(),
      tools: [],
    };

    const tokens: string[] = [];
    const loop = new AgentLoop({
      provider,
      dispatcher,
      onToken: (t) => tokens.push(t),
    });

    const result = await loop.run('こんにちは', context);
    expect(result).toBe('こんにちは！お手伝いします。');
    expect(context.messages.length).toBe(2); // user + assistant
  });

  it('複数ターンの会話を維持する', async () => {
    const provider = createMockProvider([
      { content: [{ type: 'text', text: '応答1' }], stop_reason: 'end_turn' },
      { content: [{ type: 'text', text: '応答2' }], stop_reason: 'end_turn' },
    ]);

    const dispatcher = new ToolDispatcher();
    const promptManager = new SystemPromptManager();
    const context: ConversationContext = {
      messages: [],
      systemPrompt: promptManager.build(),
      tools: [],
    };

    const loop = new AgentLoop({ provider, dispatcher });

    await loop.run('質問1', context);
    expect(context.messages.length).toBe(2);

    await loop.run('質問2', context);
    expect(context.messages.length).toBe(4); // 2ターン分
  });
});

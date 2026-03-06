import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AgentLoop } from '../../src/agent/agent-loop.js';
import { ToolDispatcher } from '../../src/agent/tool-dispatcher.js';
import { registerAllTools } from '../../src/tools/index.js';
import type { Provider, ConversationContext, MessageStream } from '../../src/types/index.js';

// モック Provider: finalMessage() を返す簡易実装
function createMockProvider(
  responses: Array<{
    content: Array<
      | { type: 'text'; text: string }
      | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
    >;
    stop_reason: string;
  }>,
): Provider {
  let callIndex = 0;
  return {
    modelId: 'mock-model',
    createMessage: vi.fn().mockImplementation(async () => {
      const response = responses[callIndex++];
      if (!response) {
        throw new Error('No more mock responses');
      }
      return {
        finalMessage: async () => ({
          content: response.content,
          stop_reason: response.stop_reason,
        }),
      } as unknown as MessageStream;
    }),
  };
}

describe('AgentLoop 統合テスト', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'agent-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('テキスト応答のみの場合、応答テキストを返す', async () => {
    const provider = createMockProvider([
      {
        content: [{ type: 'text', text: 'こんにちは！' }],
        stop_reason: 'end_turn',
      },
    ]);

    const dispatcher = new ToolDispatcher();
    const tokens: string[] = [];
    const loop = new AgentLoop({
      provider,
      dispatcher,
      onToken: (t) => tokens.push(t),
    });

    const context: ConversationContext = {
      messages: [],
      systemPrompt: 'test',
      tools: [],
    };

    const result = await loop.run('こんにちは', context);
    expect(result).toBe('こんにちは！');
    expect(tokens).toContain('こんにちは！');
  });

  it('tool_use → tool_result → end_turn のループを処理する', async () => {
    const filePath = join(tempDir, 'test.txt');
    writeFileSync(filePath, 'hello world');

    const provider = createMockProvider([
      {
        content: [
          { type: 'tool_use', id: 'tool-1', name: 'Read', input: { file_path: filePath } },
        ],
        stop_reason: 'tool_use',
      },
      {
        content: [{ type: 'text', text: 'ファイルの内容は hello world です。' }],
        stop_reason: 'end_turn',
      },
    ]);

    const dispatcher = new ToolDispatcher();
    registerAllTools(dispatcher);
    const loop = new AgentLoop({ provider, dispatcher });

    const context: ConversationContext = {
      messages: [],
      systemPrompt: 'test',
      tools: [],
    };

    const result = await loop.run('ファイルを読んで', context);
    expect(result).toContain('hello world');
    // messages に user, assistant(tool_use), user(tool_result), assistant(end_turn) が含まれる
    expect(context.messages.length).toBe(4);
  });

  it('max_tokens の場合、通知メッセージを表示する', async () => {
    const provider = createMockProvider([
      {
        content: [{ type: 'text', text: '途中で切れ' }],
        stop_reason: 'max_tokens',
      },
    ]);

    const dispatcher = new ToolDispatcher();
    const tokens: string[] = [];
    const loop = new AgentLoop({
      provider,
      dispatcher,
      onToken: (t) => tokens.push(t),
    });

    const context: ConversationContext = { messages: [], systemPrompt: 'test', tools: [] };
    await loop.run('何か長い話をして', context);
    const allOutput = tokens.join('');
    expect(allOutput).toContain('最大トークン数に達しました');
  });
});

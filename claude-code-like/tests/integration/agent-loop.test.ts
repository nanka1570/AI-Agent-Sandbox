import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AgentLoop } from '../../src/agent/agent-loop.js';
import { ToolDispatcher } from '../../src/agent/tool-dispatcher.js';
import { registerAllTools } from '../../src/tools/index.js';
import type { ConversationContext } from '../../src/types/index.js';
import { createMockProvider } from '../helpers/mock-provider.js';

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

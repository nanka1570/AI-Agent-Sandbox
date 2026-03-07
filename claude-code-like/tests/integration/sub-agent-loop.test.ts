import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AgentLoop } from '../../src/agent/agent-loop.js';
import { ToolDispatcher } from '../../src/agent/tool-dispatcher.js';
import { createSubAgentTool } from '../../src/tools/sub-agent.js';
import { createReadTool } from '../../src/tools/read.js';
import type { ConversationContext } from '../../src/types/index.js';
import { createMockProvider } from '../helpers/mock-provider.js';

describe('サブエージェントループ統合テスト', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sub-agent-int-'));
    const agentsDir = join(tempDir, '.agents');
    mkdirSync(agentsDir);
    writeFileSync(
      join(agentsDir, 'reviewer.md'),
      '---\nname: reviewer\ndescription: レビューエージェント\ntools: Read\n---\nコードをレビューしてください',
    );
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('メインループからサブエージェントを起動して結果を受け取る', async () => {
    // メインの Provider: SubAgent 呼び出し → 結果を受けて応答
    const mainProvider = createMockProvider([
      {
        content: [{
          type: 'tool_use',
          id: 'sub-1',
          name: 'SubAgent',
          input: { agent: 'reviewer', task: 'コードをレビューして' },
        }],
        stop_reason: 'tool_use',
      },
      {
        content: [{ type: 'text', text: 'レビュー結果を確認しました' }],
        stop_reason: 'end_turn',
      },
    ]);

    // サブエージェントの Provider
    const subProvider = createMockProvider([
      {
        content: [{ type: 'text', text: 'レビュー完了: 問題なし' }],
        stop_reason: 'end_turn',
      },
    ]);

    const dispatcher = new ToolDispatcher();
    dispatcher.register(createReadTool());
    dispatcher.register(createSubAgentTool({
      provider: subProvider,
      agentDirs: [join(tempDir, '.agents')],
    }));

    const loop = new AgentLoop({ provider: mainProvider, dispatcher });
    const context: ConversationContext = { messages: [], systemPrompt: 'test', tools: [] };

    const result = await loop.run('コードをレビューして', context);
    expect(result).toContain('レビュー結果を確認しました');
    // user + assistant(tool_use) + user(tool_result) + assistant(end_turn)
    expect(context.messages.length).toBeGreaterThanOrEqual(4);
  });
});

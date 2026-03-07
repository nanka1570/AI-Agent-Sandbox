import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createSubAgentTool } from '../../../src/tools/sub-agent.js';
import { createMockProvider } from '../../helpers/mock-provider.js';

describe('SubAgent ツール', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'subagent-test-'));
    const agentsDir = join(tempDir, '.agents');
    mkdirSync(agentsDir);
    writeFileSync(
      join(agentsDir, 'test-agent.md'),
      '---\nname: test-agent\ndescription: テストエージェント\ntools: Read, Glob\n---\n# 指示\n\nテスト用エージェントです',
    );
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('サブエージェントを実行して結果を返す', async () => {
    const provider = createMockProvider([
      { content: [{ type: 'text', text: 'サブエージェントの結果です' }], stop_reason: 'end_turn' },
    ]);

    const tool = createSubAgentTool({
      provider,
      agentDirs: [join(tempDir, '.agents')],
    });

    const result = await tool.handler({ agent: 'test-agent', task: 'テストタスク' });
    expect(result.is_error).toBeUndefined();
    expect(result.content).toContain('サブエージェントの結果です');
  });

  it('存在しないエージェントの場合エラーを返す', async () => {
    const provider = createMockProvider([]);
    const tool = createSubAgentTool({
      provider,
      agentDirs: [join(tempDir, '.agents')],
    });

    const result = await tool.handler({ agent: 'nonexistent', task: 'タスク' });
    expect(result.is_error).toBe(true);
    expect(result.content).toContain('見つかりません');
  });
});

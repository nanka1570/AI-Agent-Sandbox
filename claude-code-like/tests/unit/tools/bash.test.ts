import { describe, it, expect } from 'vitest';
import { createBashTool } from '../../../src/tools/bash.js';

describe('Bash ツール', () => {
  const tool = createBashTool();

  it('requiresConfirmation が true である', () => {
    expect(tool.requiresConfirmation).toBe(true);
  });

  it('コマンドを実行して stdout を返す', async () => {
    const result = await tool.handler({ command: 'echo "hello"' });
    expect(result.content).toContain('hello');
    expect(result.is_error).toBeUndefined();
  });

  it('失敗したコマンドのエラーを返す', async () => {
    const result = await tool.handler({ command: 'exit 42' });
    expect(result.is_error).toBe(true);
    expect(result.content).toContain('exit 42');
  });

  it('タイムアウトした場合エラーを返す', async () => {
    const shortTimeoutTool = createBashTool({ timeout: 1 });
    const result = await shortTimeoutTool.handler({ command: 'sleep 10' });
    expect(result.is_error).toBe(true);
    expect(result.content).toContain('タイムアウト');
  });
});

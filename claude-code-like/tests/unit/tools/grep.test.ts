import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createGrepTool } from '../../../src/tools/grep.js';

describe('Grep ツール', () => {
  const tool = createGrepTool();
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'grep-test-'));
    writeFileSync(join(tempDir, 'file1.ts'), 'const foo = 1;\nconst bar = 2;\nconst baz = 3;\n');
    writeFileSync(join(tempDir, 'file2.ts'), 'function hello() {\n  return "world";\n}\n');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('正規表現パターンでファイル内容を検索する', async () => {
    const result = await tool.handler({ pattern: 'const bar', path: tempDir });
    expect(result.content).toContain('const bar');
    expect(result.content).toContain('file1.ts');
  });

  it('コンテキスト行を含めて返す', async () => {
    const result = await tool.handler({ pattern: 'const bar', path: tempDir, context_lines: 1 });
    expect(result.content).toContain('const foo');
    expect(result.content).toContain('const baz');
  });

  it('マッチしない場合メッセージを返す', async () => {
    const result = await tool.handler({ pattern: 'nonexistent', path: tempDir });
    expect(result.content).toContain('見つかりませんでした');
  });

  it('バイナリファイルをスキップする', async () => {
    writeFileSync(join(tempDir, 'binary.bin'), Buffer.from([0x48, 0x00, 0x6c]));
    const result = await tool.handler({ pattern: '.*', path: tempDir, glob: '**/*' });
    expect(result.content).not.toContain('binary.bin');
  });

  it('無効な正規表現の場合エラーを返す', async () => {
    const result = await tool.handler({ pattern: '[invalid', path: tempDir });
    expect(result.is_error).toBe(true);
    expect(result.content).toContain('無効な正規表現');
  });
});

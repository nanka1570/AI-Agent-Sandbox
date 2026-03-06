import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createGlobTool } from '../../../src/tools/glob.js';

describe('Glob ツール', () => {
  const tool = createGlobTool();
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'glob-test-'));
    writeFileSync(join(tempDir, 'file1.ts'), 'content1');
    writeFileSync(join(tempDir, 'file2.ts'), 'content2');
    writeFileSync(join(tempDir, 'file3.js'), 'content3');
    mkdirSync(join(tempDir, 'sub'));
    writeFileSync(join(tempDir, 'sub', 'nested.ts'), 'content4');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('glob パターンでファイルを検索する', async () => {
    const result = await tool.handler({ pattern: '**/*.ts', path: tempDir });
    expect(result.content).toContain('file1.ts');
    expect(result.content).toContain('file2.ts');
    expect(result.content).toContain('nested.ts');
    expect(result.content).not.toContain('file3.js');
  });

  it('マッチするファイルがない場合メッセージを返す', async () => {
    const result = await tool.handler({ pattern: '**/*.py', path: tempDir });
    expect(result.content).toContain('見つかりませんでした');
  });

  it('node_modules を除外する', async () => {
    mkdirSync(join(tempDir, 'node_modules'));
    writeFileSync(join(tempDir, 'node_modules', 'pkg.ts'), 'content');
    const result = await tool.handler({ pattern: '**/*.ts', path: tempDir });
    expect(result.content).not.toContain('node_modules');
  });
});

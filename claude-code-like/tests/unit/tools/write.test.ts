import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createWriteTool } from '../../../src/tools/write.js';

describe('Write ツール', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'write-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('新規ファイルを作成する', async () => {
    const tool = createWriteTool();
    const filePath = join(tempDir, 'new.txt');
    const result = await tool.handler({ file_path: filePath, content: 'hello\nworld' });
    expect(result.is_error).toBeUndefined();
    expect(result.content).toContain('2 lines');
    expect(readFileSync(filePath, 'utf-8')).toBe('hello\nworld');
  });

  it('親ディレクトリが存在しない場合は自動作成する', async () => {
    const tool = createWriteTool();
    const filePath = join(tempDir, 'deep', 'nested', 'file.txt');
    const result = await tool.handler({ file_path: filePath, content: 'content' });
    expect(result.is_error).toBeUndefined();
    expect(existsSync(filePath)).toBe(true);
  });

  it('既存ファイル上書き時に確認プロンプトを表示する', async () => {
    const onConfirm = vi.fn().mockResolvedValue(true);
    const tool = createWriteTool({ onConfirm });
    const filePath = join(tempDir, 'existing.txt');
    writeFileSync(filePath, 'old');
    await tool.handler({ file_path: filePath, content: 'new' });
    expect(onConfirm).toHaveBeenCalled();
    expect(readFileSync(filePath, 'utf-8')).toBe('new');
  });

  it('ユーザーが上書きを拒否した場合エラーを返す', async () => {
    const onConfirm = vi.fn().mockResolvedValue(false);
    const tool = createWriteTool({ onConfirm });
    const filePath = join(tempDir, 'existing.txt');
    writeFileSync(filePath, 'old');
    const result = await tool.handler({ file_path: filePath, content: 'new' });
    expect(result.is_error).toBe(true);
    expect(readFileSync(filePath, 'utf-8')).toBe('old');
  });

  it('新規ファイル作成時は確認なし', async () => {
    const onConfirm = vi.fn();
    const tool = createWriteTool({ onConfirm });
    const filePath = join(tempDir, 'brand-new.txt');
    await tool.handler({ file_path: filePath, content: 'content' });
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

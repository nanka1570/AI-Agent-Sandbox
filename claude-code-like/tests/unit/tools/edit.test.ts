import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createEditTool } from '../../../src/tools/edit.js';

describe('Edit ツール', () => {
  const tool = createEditTool();
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'edit-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('old_string を new_string に置換する', async () => {
    const filePath = join(tempDir, 'test.txt');
    writeFileSync(filePath, 'hello world');
    const result = await tool.handler({
      file_path: filePath,
      old_string: 'hello',
      new_string: 'goodbye',
    });
    expect(result.is_error).toBeUndefined();
    expect(readFileSync(filePath, 'utf-8')).toBe('goodbye world');
    expect(result.content).toContain('-hello world');
    expect(result.content).toContain('+goodbye world');
  });

  it('old_string が見つからない場合エラーを返す', async () => {
    const filePath = join(tempDir, 'test.txt');
    writeFileSync(filePath, 'hello world');
    const result = await tool.handler({
      file_path: filePath,
      old_string: 'nonexistent',
      new_string: 'replacement',
    });
    expect(result.is_error).toBe(true);
    expect(result.content).toContain('見つかりません');
  });

  it('old_string が複数箇所にマッチする場合エラーを返す', async () => {
    const filePath = join(tempDir, 'test.txt');
    writeFileSync(filePath, 'aaa bbb aaa');
    const result = await tool.handler({
      file_path: filePath,
      old_string: 'aaa',
      new_string: 'ccc',
    });
    expect(result.is_error).toBe(true);
    expect(result.content).toContain('2 箇所');
  });

  it('存在しないファイルの場合エラーを返す', async () => {
    const result = await tool.handler({
      file_path: '/nonexistent/file.txt',
      old_string: 'a',
      new_string: 'b',
    });
    expect(result.is_error).toBe(true);
  });
});

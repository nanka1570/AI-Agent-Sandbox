import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createReadTool } from '../../../src/tools/read.js';

describe('Read ツール', () => {
  const tool = createReadTool();
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'read-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('指定パスのファイル内容を行番号付きで返す', async () => {
    const filePath = join(tempDir, 'test.txt');
    writeFileSync(filePath, 'line1\nline2\nline3');
    const result = await tool.handler({ file_path: filePath });
    expect(result.is_error).toBeUndefined();
    expect(result.content).toContain('1\tline1');
    expect(result.content).toContain('2\tline2');
    expect(result.content).toContain('3\tline3');
  });

  it('offset と limit で部分読み取りできる', async () => {
    const filePath = join(tempDir, 'test.txt');
    writeFileSync(filePath, 'a\nb\nc\nd\ne');
    const result = await tool.handler({ file_path: filePath, offset: 2, limit: 2 });
    expect(result.content).toContain('2\tb');
    expect(result.content).toContain('3\tc');
    expect(result.content).not.toContain('1\ta');
    expect(result.content).not.toContain('4\td');
  });

  it('存在しないファイルの場合エラーを返す', async () => {
    const result = await tool.handler({ file_path: '/nonexistent/file.txt' });
    expect(result.is_error).toBe(true);
    expect(result.content).toContain('ファイルが見つかりません');
  });

  it('バイナリファイルの場合メッセージを返す', async () => {
    const filePath = join(tempDir, 'binary.bin');
    writeFileSync(filePath, Buffer.from([0x48, 0x65, 0x00, 0x6c, 0x6f]));
    const result = await tool.handler({ file_path: filePath });
    expect(result.content).toContain('バイナリファイルのため読み取りをスキップしました');
  });
});

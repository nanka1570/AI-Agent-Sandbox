import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SystemPromptManager } from '../../../src/agent/system-prompt.js';
import type { CommandDefinition } from '../../../src/types/index.js';

describe('SystemPromptManager', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'system-prompt-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('基本システムプロンプトを生成する', () => {
    const manager = new SystemPromptManager(tempDir);

    const prompt = manager.build();

    expect(prompt).toContain('AI ペアプログラマー');
  });

  it('CLAUDE.md が存在する場合、内容をプロンプトに注入する', () => {
    writeFileSync(join(tempDir, 'CLAUDE.md'), '# プロジェクト設定\nテスト専用設定');
    const manager = new SystemPromptManager(tempDir);

    const prompt = manager.build();

    expect(prompt).toContain('プロジェクト設定 (CLAUDE.md)');
    expect(prompt).toContain('テスト専用設定');
  });

  it('CLAUDE.md が存在しない場合、基本プロンプトのみ返す', () => {
    const manager = new SystemPromptManager(tempDir);

    const prompt = manager.build();

    expect(prompt).not.toContain('プロジェクト設定 (CLAUDE.md)');
    expect(prompt).not.toContain('コマンド:');
  });

  it('コマンドが指定された場合、コマンド内容をプロンプトに追加する', () => {
    const command: CommandDefinition = {
      name: 'add-feature',
      description: '機能追加コマンド',
      body: 'このコマンドは新機能を追加します。',
      filePath: '/dummy/path',
    };
    const manager = new SystemPromptManager(tempDir);

    const prompt = manager.build({ command });

    expect(prompt).toContain('コマンド: add-feature');
    expect(prompt).toContain('このコマンドは新機能を追加します。');
  });
});

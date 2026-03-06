import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CommandLoader } from '../../../src/loaders/command-loader.js';

describe('CommandLoader', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'cmd-test-'));
    const commandsDir = join(tempDir, '.commands');
    mkdirSync(commandsDir);
    writeFileSync(
      join(commandsDir, 'test-cmd.md'),
      '---\ndescription: テストコマンド\nallowed-tools: Read, Write\n---\n# テスト手順\n\n手順の内容',
    );
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('コマンド定義を読み込む', async () => {
    const loader = new CommandLoader();
    await loader.loadCommands([join(tempDir, '.commands')]);
    const commands = loader.listCommands();
    expect(commands.length).toBe(1);
    expect(commands[0]?.name).toBe('test-cmd');
    expect(commands[0]?.description).toBe('テストコマンド');
  });

  it('コマンド名で解決する', async () => {
    const loader = new CommandLoader();
    await loader.loadCommands([join(tempDir, '.commands')]);
    const cmd = loader.resolve('test-cmd');
    expect(cmd).not.toBeNull();
    expect(cmd?.body).toContain('テスト手順');
    expect(cmd?.allowedTools).toEqual(['Read', 'Write']);
  });

  it('存在しないコマンドは null を返す', async () => {
    const loader = new CommandLoader();
    await loader.loadCommands([join(tempDir, '.commands')]);
    expect(loader.resolve('nonexistent')).toBeNull();
  });

  it('help はビルトインコマンドとして null を返す', async () => {
    const loader = new CommandLoader();
    await loader.loadCommands([join(tempDir, '.commands')]);
    expect(loader.resolve('help')).toBeNull();
    expect(loader.isBuiltinCommand('help')).toBe(true);
  });
});

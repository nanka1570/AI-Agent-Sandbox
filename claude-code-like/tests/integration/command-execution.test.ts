import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CommandLoader } from '../../src/loaders/command-loader.js';
import { SystemPromptManager } from '../../src/agent/system-prompt.js';

describe('コマンド実行統合テスト', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'cmd-int-test-'));
    const commandsDir = join(tempDir, '.commands');
    mkdirSync(commandsDir);
    writeFileSync(
      join(commandsDir, 'deploy.md'),
      '---\ndescription: デプロイを実行する\nallowed-tools: Bash\n---\n# デプロイ手順\n\n1. ビルドする\n2. デプロイする',
    );
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('コマンドを読み込みシステムプロンプトに注入する', async () => {
    const loader = new CommandLoader();
    await loader.loadCommands([join(tempDir, '.commands')]);

    const command = loader.resolve('deploy');
    expect(command).not.toBeNull();

    const promptManager = new SystemPromptManager(tempDir);
    const prompt = promptManager.build({ command: command! });

    expect(prompt).toContain('デプロイ手順');
    expect(prompt).toContain('ビルドする');
  });
});

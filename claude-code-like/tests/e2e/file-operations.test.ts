import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AgentLoop } from '../../src/agent/agent-loop.js';
import { ToolDispatcher } from '../../src/agent/tool-dispatcher.js';
import { SystemPromptManager } from '../../src/agent/system-prompt.js';
import { registerAllTools } from '../../src/tools/index.js';
import type { ConversationContext } from '../../src/types/index.js';
import { createMockProvider } from '../helpers/mock-provider.js';

describe('E2E: ファイル操作フロー', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'e2e-file-'));
    writeFileSync(join(tempDir, 'sample.txt'), 'Hello World\nLine 2\nLine 3');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('Read → Edit のツール連鎖でファイルを編集する', async () => {
    const filePath = join(tempDir, 'sample.txt');

    const provider = createMockProvider([
      // 1回目: Read ツール呼び出し
      {
        content: [{ type: 'tool_use', id: 'read-1', name: 'Read', input: { file_path: filePath } }],
        stop_reason: 'tool_use',
      },
      // 2回目: Edit ツール呼び出し
      {
        content: [{
          type: 'tool_use',
          id: 'edit-1',
          name: 'Edit',
          input: { file_path: filePath, old_string: 'Hello World', new_string: 'Goodbye World' },
        }],
        stop_reason: 'tool_use',
      },
      // 3回目: 最終応答
      {
        content: [{ type: 'text', text: 'ファイルを編集しました。' }],
        stop_reason: 'end_turn',
      },
    ]);

    const dispatcher = new ToolDispatcher();
    registerAllTools(dispatcher);

    const context: ConversationContext = {
      messages: [],
      systemPrompt: new SystemPromptManager().build(),
      tools: [],
    };

    const loop = new AgentLoop({ provider, dispatcher });
    const result = await loop.run('sample.txt の Hello を Goodbye に変更して', context);

    expect(result).toContain('編集しました');
    expect(readFileSync(filePath, 'utf-8')).toBe('Goodbye World\nLine 2\nLine 3');
  });
});

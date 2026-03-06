import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createTwoFilesPatch } from 'diff';
import type { ToolDefinition, ToolResult } from '../types/index.js';

export function createEditTool(): ToolDefinition {
  return {
    name: 'Edit',
    description: 'ファイルの一部を old_string → new_string で置換します。',
    input_schema: {
      type: 'object' as const,
      properties: {
        file_path: { type: 'string', description: '編集対象ファイルのパス' },
        old_string: { type: 'string', description: '置換対象の文字列（完全一致）' },
        new_string: { type: 'string', description: '置換後の文字列' },
      },
      required: ['file_path', 'old_string', 'new_string'],
    },
    handler: async (input): Promise<ToolResult> => {
      const filePath = input.file_path as string;
      const oldString = input.old_string as string;
      const newString = input.new_string as string;

      if (!existsSync(filePath)) {
        return { content: `ファイルが見つかりません: ${filePath}`, is_error: true };
      }

      try {
        const content = readFileSync(filePath, 'utf-8');

        // マッチ回数をカウント
        let count = 0;
        let pos = 0;
        while ((pos = content.indexOf(oldString, pos)) !== -1) {
          count++;
          pos += oldString.length;
        }

        if (count === 0) {
          return { content: `old_string が見つかりません`, is_error: true };
        }
        if (count > 1) {
          return {
            content: `old_string が ${count} 箇所にマッチしました。一意になるようコンテキストを増やしてください`,
            is_error: true,
          };
        }

        // replace の第2引数で $ は特殊文字のため、$$ にエスケープする
        const escapedNewString = newString.replaceAll('$', '$$$$');
        const newContent = content.replace(oldString, escapedNewString);
        writeFileSync(filePath, newContent, 'utf-8');

        const diff = createTwoFilesPatch(filePath, filePath, content, newContent);
        return { content: diff };
      } catch (error) {
        return { content: `編集エラー: ${(error as Error).message}`, is_error: true };
      }
    },
  };
}

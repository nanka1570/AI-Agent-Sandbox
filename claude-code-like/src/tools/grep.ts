import { readFileSync } from 'node:fs';
import fg from 'fast-glob';
import type { ToolDefinition, ToolResult } from '../types/index.js';
import { TOOL_DEFAULTS } from '../constants.js';

export function createGrepTool(): ToolDefinition {
  return {
    name: 'Grep',
    description: '正規表現パターンでファイル内容を検索します。',
    input_schema: {
      type: 'object' as const,
      properties: {
        pattern: { type: 'string', description: '正規表現パターン' },
        path: { type: 'string', description: '検索ディレクトリ（デフォルト: cwd）' },
        glob: { type: 'string', description: '対象ファイルの glob パターン' },
        context_lines: { type: 'number', description: 'コンテキスト行数（デフォルト: 2）' },
      },
      required: ['pattern'],
    },
    handler: async (input): Promise<ToolResult> => {
      const pattern = input.pattern as string;
      const cwd = (input.path as string | undefined) ?? process.cwd();
      const fileGlob = (input.glob as string | undefined) ?? '**/*';
      const contextLines = (input.context_lines as number | undefined) ?? 2;

      let regex: RegExp;
      try {
        regex = new RegExp(pattern);
      } catch {
        return { content: `無効な正規表現パターン: ${pattern}`, is_error: true };
      }

      try {
        const files = await fg(fileGlob, {
          cwd,
          ignore: ['**/node_modules/**', '**/.git/**'],
          absolute: true,
          onlyFiles: true,
        });

        const results: string[] = [];
        let truncated = false;

        // ファイル数上限を適用
        const targetFiles = files.slice(0, TOOL_DEFAULTS.GREP_MAX_FILES);

        for (const file of targetFiles) {
          if (results.length >= TOOL_DEFAULTS.GREP_MAX_RESULTS) {
            truncated = true;
            break;
          }
          try {
            const buffer = readFileSync(file);
            // バイナリ判定
            if (buffer.includes(0)) continue;

            const content = buffer.toString('utf-8');
            const lines = content.split('\n');

            for (let i = 0; i < lines.length; i++) {
              if (results.length >= TOOL_DEFAULTS.GREP_MAX_RESULTS) {
                truncated = true;
                break;
              }
              const line = lines[i];
              if (line !== undefined && regex.test(line)) {
                const start = Math.max(0, i - contextLines);
                const end = Math.min(lines.length - 1, i + contextLines);
                const contextBlock: string[] = [`${file}:`];
                for (let j = start; j <= end; j++) {
                  const prefix = j === i ? '>' : ' ';
                  contextBlock.push(`${prefix} ${j + 1}: ${lines[j] ?? ''}`);
                }
                results.push(contextBlock.join('\n'));
              }
            }
          } catch {
            // ファイル読み取りエラーはスキップ
          }
        }

        if (results.length === 0) {
          return { content: 'マッチする内容が見つかりませんでした' };
        }

        let output = results.join('\n\n');
        if (truncated) {
          output += `\n\n(結果が ${TOOL_DEFAULTS.GREP_MAX_RESULTS} 件に達したため打ち切りました。検索条件を絞り込んでください)`;
        }
        if (files.length > TOOL_DEFAULTS.GREP_MAX_FILES) {
          output += `\n\n(対象ファイルが ${files.length} 件あり、先頭 ${TOOL_DEFAULTS.GREP_MAX_FILES} 件のみ検索しました。glob パターンで絞り込んでください)`;
        }

        return { content: output };
      } catch (error) {
        return { content: `検索エラー: ${(error as Error).message}`, is_error: true };
      }
    },
  };
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockedClass } from 'vitest';

// openai パッケージをモック
vi.mock('openai', () => {
  const mockCreate = vi.fn();
  const MockOpenAI = vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
  // create 関数を外部から参照できるよう MockOpenAI に付与
  (MockOpenAI as unknown as { _mockCreate: typeof mockCreate })._mockCreate = mockCreate;
  return { default: MockOpenAI };
});

import OpenAI from 'openai';
import { OpenAICompatibleProvider } from '../../../src/providers/openai-compatible.js';
import type {
  MessageParam,
  ToolResultBlockParam,
  ContentBlock,
} from '../../../src/types/provider.js';
import type { ToolSchema } from '../../../src/types/tool.js';

// モックされた OpenAI クラスから create 関数を取り出すヘルパー
function getMockCreate() {
  const MockOpenAI = OpenAI as unknown as { _mockCreate: ReturnType<typeof vi.fn> };
  return MockOpenAI._mockCreate;
}

// 最小限の成功レスポンスを生成するヘルパー
function makeCompletionResponse(override: Partial<{
  content: string | null;
  finish_reason: string | null;
  tool_calls: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }> | null;
}> = {}) {
  return {
    choices: [
      {
        message: {
          content: override.content ?? 'hello',
          tool_calls: override.tool_calls ?? null,
        },
        finish_reason: override.finish_reason ?? 'stop',
      },
    ],
  };
}

describe('OpenAICompatibleProvider', () => {
  let provider: OpenAICompatibleProvider;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new OpenAICompatibleProvider('test-api-key', 'gpt-4o', 'https://api.openai.com/v1');
    mockCreate = getMockCreate();
  });

  // -----------------------------------------------------------------------
  // mapFinishReason のテスト（createMessage 経由で間接的に検証）
  // -----------------------------------------------------------------------
  describe('mapFinishReason', () => {
    it("'stop' → 'end_turn' にマッピングされること", async () => {
      mockCreate.mockResolvedValue(makeCompletionResponse({ finish_reason: 'stop' }));

      const result = await provider.createMessage({
        system: 'system',
        messages: [{ role: 'user', content: 'hello' }],
        tools: [],
        maxTokens: 100,
      });

      expect(result.stop_reason).toBe('end_turn');
    });

    it("'tool_calls' → 'tool_use' にマッピングされること", async () => {
      mockCreate.mockResolvedValue(makeCompletionResponse({ finish_reason: 'tool_calls' }));

      const result = await provider.createMessage({
        system: 'system',
        messages: [{ role: 'user', content: 'hello' }],
        tools: [],
        maxTokens: 100,
      });

      expect(result.stop_reason).toBe('tool_use');
    });

    it("'length' → 'max_tokens' にマッピングされること", async () => {
      mockCreate.mockResolvedValue(makeCompletionResponse({ finish_reason: 'length' }));

      const result = await provider.createMessage({
        system: 'system',
        messages: [{ role: 'user', content: 'hello' }],
        tools: [],
        maxTokens: 100,
      });

      expect(result.stop_reason).toBe('max_tokens');
    });

    it('未知の値は end_turn にフォールバックすること', async () => {
      mockCreate.mockResolvedValue(makeCompletionResponse({ finish_reason: 'unknown_reason' }));

      const result = await provider.createMessage({
        system: 'system',
        messages: [{ role: 'user', content: 'hello' }],
        tools: [],
        maxTokens: 100,
      });

      expect(result.stop_reason).toBe('end_turn');
    });
  });

  // -----------------------------------------------------------------------
  // convertMessages のテスト（createMessage 経由で間接的に検証）
  // -----------------------------------------------------------------------
  describe('convertMessages', () => {
    it('system prompt が最初の system メッセージになること', async () => {
      mockCreate.mockResolvedValue(makeCompletionResponse());

      await provider.createMessage({
        system: 'あなたは優秀なアシスタントです',
        messages: [{ role: 'user', content: 'こんにちは' }],
        tools: [],
        maxTokens: 100,
      });

      const calledMessages = mockCreate.mock.calls[0][0].messages as Array<{ role: string; content: string }>;
      expect(calledMessages[0]).toEqual({ role: 'system', content: 'あなたは優秀なアシスタントです' });
    });

    it('user の文字列メッセージが正しく変換されること', async () => {
      mockCreate.mockResolvedValue(makeCompletionResponse());

      await provider.createMessage({
        system: 'system',
        messages: [{ role: 'user', content: 'テストメッセージ' }],
        tools: [],
        maxTokens: 100,
      });

      const calledMessages = mockCreate.mock.calls[0][0].messages as Array<{ role: string; content: string }>;
      expect(calledMessages[1]).toEqual({ role: 'user', content: 'テストメッセージ' });
    });

    it('ToolResultBlockParam[] が tool メッセージに変換されること', async () => {
      mockCreate.mockResolvedValue(makeCompletionResponse());

      const toolResults: ToolResultBlockParam[] = [
        { type: 'tool_result', tool_use_id: 'call_abc123', content: '実行結果のテキスト' },
        { type: 'tool_result', tool_use_id: 'call_def456', content: '別の結果', is_error: false },
      ];

      const messages: MessageParam[] = [
        { role: 'user', content: toolResults },
      ];

      await provider.createMessage({ system: 'system', messages, tools: [], maxTokens: 100 });

      const calledMessages = mockCreate.mock.calls[0][0].messages as Array<{
        role: string;
        tool_call_id: string;
        content: string;
      }>;

      // インデックス 0 は system、1〜2 が tool メッセージになる
      expect(calledMessages[1]).toEqual({ role: 'tool', tool_call_id: 'call_abc123', content: '実行結果のテキスト' });
      expect(calledMessages[2]).toEqual({ role: 'tool', tool_call_id: 'call_def456', content: '別の結果' });
    });

    it('assistant の ContentBlock[] が tool_calls 付きメッセージに変換されること', async () => {
      mockCreate.mockResolvedValue(makeCompletionResponse());

      const assistantContent: ContentBlock[] = [
        { type: 'text', text: 'ツールを呼び出します' },
        {
          type: 'tool_use',
          id: 'call_xyz789',
          name: 'read_file',
          input: { path: '/tmp/test.txt' },
        },
      ];

      const messages: MessageParam[] = [
        { role: 'assistant', content: assistantContent },
      ];

      await provider.createMessage({ system: 'system', messages, tools: [], maxTokens: 100 });

      const calledMessages = mockCreate.mock.calls[0][0].messages as Array<{
        role: string;
        content: string | null;
        tool_calls?: Array<{
          id: string;
          type: string;
          function: { name: string; arguments: string };
        }>;
      }>;

      const assistantMsg = calledMessages[1];
      expect(assistantMsg.role).toBe('assistant');
      expect(assistantMsg.content).toBe('ツールを呼び出します');
      expect(assistantMsg.tool_calls).toHaveLength(1);
      expect(assistantMsg.tool_calls?.[0]).toEqual({
        id: 'call_xyz789',
        type: 'function',
        function: {
          name: 'read_file',
          arguments: JSON.stringify({ path: '/tmp/test.txt' }),
        },
      });
    });
  });

  // -----------------------------------------------------------------------
  // convertTools のテスト（createMessage 経由で間接的に検証）
  // -----------------------------------------------------------------------
  describe('convertTools', () => {
    it('ToolSchema が OpenAI の function tool 形式に変換されること', async () => {
      mockCreate.mockResolvedValue(makeCompletionResponse());

      const tools: ToolSchema[] = [
        {
          name: 'read_file',
          description: 'ファイルを読み取るツール',
          input_schema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'ファイルパス' },
            },
            required: ['path'],
          },
        },
      ];

      await provider.createMessage({
        system: 'system',
        messages: [{ role: 'user', content: 'hello' }],
        tools,
        maxTokens: 100,
      });

      const calledTools = mockCreate.mock.calls[0][0].tools as Array<{
        type: string;
        function: {
          name: string;
          description: string;
          parameters: Record<string, unknown>;
        };
      }>;

      expect(calledTools).toHaveLength(1);
      expect(calledTools[0]).toEqual({
        type: 'function',
        function: {
          name: 'read_file',
          description: 'ファイルを読み取るツール',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'ファイルパス' },
            },
            required: ['path'],
          },
        },
      });
    });
  });

  // -----------------------------------------------------------------------
  // safeJsonParse のテスト（createMessage 経由で間接的に検証）
  // -----------------------------------------------------------------------
  describe('safeJsonParse', () => {
    it('不正な JSON でもクラッシュしないこと', async () => {
      mockCreate.mockResolvedValue(
        makeCompletionResponse({
          finish_reason: 'tool_calls',
          content: null,
          tool_calls: [
            {
              id: 'call_broken',
              type: 'function',
              function: {
                name: 'some_tool',
                arguments: '{ invalid json !!!',
              },
            },
          ],
        }),
      );

      const result = await provider.createMessage({
        system: 'system',
        messages: [{ role: 'user', content: 'hello' }],
        tools: [],
        maxTokens: 100,
      });

      // クラッシュせずに tool_use ブロックが返ること
      const toolUseBlocks = result.content.filter((b) => b.type === 'tool_use');
      expect(toolUseBlocks).toHaveLength(1);
      // 不正な JSON は空オブジェクトにフォールバックすること
      const toolUse = toolUseBlocks[0] as Extract<ContentBlock, { type: 'tool_use' }>;
      expect(toolUse.input).toEqual({});
    });
  });
});

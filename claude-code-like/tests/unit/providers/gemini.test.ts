import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

// @google/genai をモック
vi.mock('@google/genai', () => {
  const generateContent: Mock = vi.fn();
  const GoogleGenAI = vi.fn().mockImplementation(() => ({
    models: { generateContent },
  }));
  return { GoogleGenAI };
});

import { GeminiProvider } from '../../../src/providers/gemini.js';
import { GoogleGenAI } from '@google/genai';
import type { CreateMessageParams } from '../../../src/types/provider.js';

// generateContent モック関数への参照を取得するヘルパー
function getGenerateContent(): Mock {
  const instance = (GoogleGenAI as unknown as Mock).mock.results[0]?.value as {
    models: { generateContent: Mock };
  };
  return instance.models.generateContent;
}

// デフォルトの CreateMessageParams
function baseParams(overrides: Partial<CreateMessageParams> = {}): CreateMessageParams {
  return {
    messages: [],
    system: 'system prompt',
    tools: [],
    maxTokens: 1024,
    ...overrides,
  };
}

// モックレスポンスを candidates[0].content.parts 形式で生成するヘルパー
function mockResponse(opts: {
  parts?: Array<{ text?: string; functionCall?: { id?: string; name?: string; args?: Record<string, unknown> } }>;
  finishReason?: string;
}) {
  return {
    candidates: [{
      finishReason: opts.finishReason ?? 'STOP',
      content: { parts: opts.parts ?? [] },
    }],
  };
}

describe('GeminiProvider', () => {
  let provider: GeminiProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new GeminiProvider('test-api-key', 'gemini-2.0-flash');
  });

  // ---- createMessage: レスポンス変換 ----------------------------------------

  describe('テキスト応答を LLMResponse 形式に変換すること', () => {
    it('text パーツがある場合、TextBlock が content に含まれる', async () => {
      const generateContent = getGenerateContent();
      generateContent.mockResolvedValue(
        mockResponse({ parts: [{ text: 'Hello, world!' }], finishReason: 'STOP' }),
      );

      const result = await provider.createMessage(baseParams());

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({ type: 'text', text: 'Hello, world!' });
      expect(result.stop_reason).toBe('end_turn');
    });
  });

  describe('functionCalls を tool_use ブロックに変換すること', () => {
    it('functionCall パーツが存在する場合、tool_use ブロックが content に追加される', async () => {
      const generateContent = getGenerateContent();
      generateContent.mockResolvedValue(
        mockResponse({
          parts: [{ functionCall: { id: 'call-123', name: 'read_file', args: { path: '/tmp/foo.txt' } } }],
          finishReason: 'FUNCTION_CALL',
        }),
      );

      const result = await provider.createMessage(baseParams());

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toMatchObject({
        type: 'tool_use',
        id: 'call-123',
        name: 'read_file',
        input: { path: '/tmp/foo.txt' },
      });
      expect(result.stop_reason).toBe('tool_use');
    });

    it('functionCall に id がない場合、自動生成した id が設定される', async () => {
      const generateContent = getGenerateContent();
      generateContent.mockResolvedValue(
        mockResponse({
          parts: [{ functionCall: { name: 'list_files', args: {} } }],
          finishReason: 'FUNCTION_CALL',
        }),
      );

      const result = await provider.createMessage(baseParams());

      const block = result.content[0];
      expect(block.type).toBe('tool_use');
      if (block.type === 'tool_use') {
        expect(block.id).toMatch(/^call_\d+_[a-z0-9]+$/);
      }
    });
  });

  describe('functionCalls の name が未定義のときスキップすること', () => {
    it('name が undefined の functionCall は content に追加されない', async () => {
      const generateContent = getGenerateContent();
      generateContent.mockResolvedValue(
        mockResponse({
          parts: [
            { text: 'fallback text' },
            { functionCall: { id: 'call-999', args: {} } },
          ],
          finishReason: 'STOP',
        }),
      );

      const result = await provider.createMessage(baseParams());

      // name なしの functionCall がスキップされ、text ブロックのみ残る
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({ type: 'text', text: 'fallback text' });
    });
  });

  describe('空レスポンス時にフォールバックテキストブロックを返すこと', () => {
    it('text も functionCall も存在しない場合、空テキストブロックが返される', async () => {
      const generateContent = getGenerateContent();
      generateContent.mockResolvedValue(mockResponse({ parts: [] }));

      const result = await provider.createMessage(baseParams());

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({ type: 'text', text: '' });
    });

    it('candidates が空の場合も空テキストブロックが返される', async () => {
      const generateContent = getGenerateContent();
      generateContent.mockResolvedValue({ candidates: [] });

      const result = await provider.createMessage(baseParams());

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({ type: 'text', text: '' });
    });
  });

  // ---- mapFinishReason -------------------------------------------------------

  describe("mapFinishReason: 'STOP' → 'end_turn' にマッピングされること", () => {
    it("candidates[0].finishReason が 'STOP' のとき stop_reason は 'end_turn'", async () => {
      const generateContent = getGenerateContent();
      generateContent.mockResolvedValue(
        mockResponse({ parts: [{ text: 'ok' }], finishReason: 'STOP' }),
      );

      const result = await provider.createMessage(baseParams());
      expect(result.stop_reason).toBe('end_turn');
    });
  });

  describe("mapFinishReason: 'MAX_TOKENS' → 'max_tokens' にマッピングされること", () => {
    it("candidates[0].finishReason が 'MAX_TOKENS' のとき stop_reason は 'max_tokens'", async () => {
      const generateContent = getGenerateContent();
      generateContent.mockResolvedValue(
        mockResponse({ parts: [{ text: 'truncated' }], finishReason: 'MAX_TOKENS' }),
      );

      const result = await provider.createMessage(baseParams());
      expect(result.stop_reason).toBe('max_tokens');
    });
  });

  describe("mapFinishReason: 'FUNCTION_CALL' → 'tool_use' にマッピングされること", () => {
    it("candidates[0].finishReason が 'FUNCTION_CALL' のとき stop_reason は 'tool_use'", async () => {
      const generateContent = getGenerateContent();
      generateContent.mockResolvedValue(
        mockResponse({
          parts: [{ functionCall: { id: 'x', name: 'tool_x', args: {} } }],
          finishReason: 'FUNCTION_CALL',
        }),
      );

      const result = await provider.createMessage(baseParams());
      expect(result.stop_reason).toBe('tool_use');
    });
  });

  // ---- convertMessages -------------------------------------------------------

  describe('convertMessages: user の文字列メッセージが正しく変換されること', () => {
    it('user の string content が { role: user, parts: [{ text }] } に変換される', async () => {
      const generateContent = getGenerateContent();
      generateContent.mockResolvedValue(
        mockResponse({ parts: [{ text: 'response' }] }),
      );

      await provider.createMessage(
        baseParams({
          messages: [{ role: 'user', content: 'Hello from user' }],
        }),
      );

      const callArg = generateContent.mock.calls[0]?.[0] as {
        contents: { role: string; parts: { text: string }[] }[];
      };
      expect(callArg.contents[0]).toEqual({
        role: 'user',
        parts: [{ text: 'Hello from user' }],
      });
    });
  });

  describe('convertMessages: ToolResultBlockParam[] が functionResponse に変換されること', () => {
    it('tool_result メッセージが functionResponse parts に変換される', async () => {
      const generateContent = getGenerateContent();
      generateContent.mockResolvedValue(
        mockResponse({ parts: [{ text: 'done' }] }),
      );

      await provider.createMessage(
        baseParams({
          messages: [
            {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'call-abc',
                  name: 'read_file',
                  input: { path: '/tmp/a.txt' },
                },
              ],
            },
            {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'call-abc',
                  content: 'file content here',
                },
              ],
            },
          ],
        }),
      );

      const callArg = generateContent.mock.calls[0]?.[0] as {
        contents: {
          role: string;
          parts: { functionResponse?: { id: string; name: string; response: { output: string } } }[];
        }[];
      };

      const userMsg = callArg.contents[1];
      expect(userMsg?.role).toBe('user');
      expect(userMsg?.parts[0]?.functionResponse).toMatchObject({
        id: 'call-abc',
        name: 'read_file',
        response: { output: 'file content here' },
      });
    });
  });

  describe('convertMessages: assistant の ContentBlock[] が model メッセージに変換されること', () => {
    it('assistant の text + tool_use が model parts に変換される', async () => {
      const generateContent = getGenerateContent();
      generateContent.mockResolvedValue(
        mockResponse({ parts: [{ text: 'ok' }] }),
      );

      await provider.createMessage(
        baseParams({
          messages: [
            {
              role: 'assistant',
              content: [
                { type: 'text', text: 'thinking...' },
                {
                  type: 'tool_use',
                  id: 'call-xyz',
                  name: 'bash',
                  input: { command: 'ls' },
                },
              ],
            },
          ],
        }),
      );

      const callArg = generateContent.mock.calls[0]?.[0] as {
        contents: {
          role: string;
          parts: {
            text?: string;
            functionCall?: { id: string; name: string; args: Record<string, unknown> };
          }[];
        }[];
      };

      const modelMsg = callArg.contents[0];
      expect(modelMsg?.role).toBe('model');
      expect(modelMsg?.parts).toHaveLength(2);
      expect(modelMsg?.parts[0]).toEqual({ text: 'thinking...' });
      expect(modelMsg?.parts[1]?.functionCall).toMatchObject({
        id: 'call-xyz',
        name: 'bash',
        args: { command: 'ls' },
      });
    });
  });

  describe('convertMessages: functionResponse の name が直前の functionCall から正しく解決されること', () => {
    it('直前の model メッセージの functionCall.id から name が解決される', async () => {
      const generateContent = getGenerateContent();
      generateContent.mockResolvedValue(
        mockResponse({ parts: [{ text: 'resolved' }] }),
      );

      await provider.createMessage(
        baseParams({
          messages: [
            {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'id-001',
                  name: 'write_file',
                  input: { path: '/tmp/out.txt', content: 'hello' },
                },
              ],
            },
            {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'id-001',
                  content: 'written',
                },
              ],
            },
          ],
        }),
      );

      const callArg = generateContent.mock.calls[0]?.[0] as {
        contents: {
          role: string;
          parts: { functionResponse?: { id: string; name: string } }[];
        }[];
      };

      const toolResultMsg = callArg.contents[1];
      expect(toolResultMsg?.parts[0]?.functionResponse?.name).toBe('write_file');
    });

    it('対応する functionCall が存在しない場合は tool_use_id が name のフォールバックになる', async () => {
      const generateContent = getGenerateContent();
      generateContent.mockResolvedValue(
        mockResponse({ parts: [{ text: 'fallback' }] }),
      );

      await provider.createMessage(
        baseParams({
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'unknown-id',
                  content: 'some result',
                },
              ],
            },
          ],
        }),
      );

      const callArg = generateContent.mock.calls[0]?.[0] as {
        contents: {
          role: string;
          parts: { functionResponse?: { id: string; name: string } }[];
        }[];
      };

      expect(callArg.contents[0]?.parts[0]?.functionResponse?.name).toBe('unknown-id');
    });
  });
});

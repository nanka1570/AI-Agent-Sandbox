import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProviderFactory } from '../../../src/providers/provider-factory.js';
import { AnthropicProvider } from '../../../src/providers/anthropic.js';
import { GeminiProvider } from '../../../src/providers/gemini.js';
import { OpenAICompatibleProvider } from '../../../src/providers/openai-compatible.js';
import { DEFAULT_CONFIG } from '../../../src/types/index.js';
import type { AppConfig } from '../../../src/types/index.js';

// 各プロバイダークラスをモックして、実際の API クライアント初期化を防ぐ
vi.mock('../../../src/providers/anthropic.js', () => ({
  AnthropicProvider: vi.fn().mockImplementation((apiKey: string, model: string) => ({
    modelId: model,
    createMessage: vi.fn(),
  })),
}));

vi.mock('../../../src/providers/gemini.js', () => ({
  GeminiProvider: vi.fn().mockImplementation((apiKey: string, model: string) => ({
    modelId: model,
    createMessage: vi.fn(),
  })),
}));

vi.mock('../../../src/providers/openai-compatible.js', () => ({
  OpenAICompatibleProvider: vi.fn().mockImplementation((apiKey: string, model: string, baseURL: string) => ({
    modelId: model,
    createMessage: vi.fn(),
    // テスト用に baseURL を保持して name 判定に使う
    _baseURL: baseURL,
  })),
}));

describe('ProviderFactory', () => {
  let savedEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // 環境変数を退避してテストごとにクリーンな状態にする
    savedEnv = { ...process.env };
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    // モックの呼び出し履歴をリセット
    vi.mocked(AnthropicProvider).mockClear();
    vi.mocked(GeminiProvider).mockClear();
    vi.mocked(OpenAICompatibleProvider).mockClear();
  });

  afterEach(() => {
    // 環境変数を復元する
    process.env = savedEnv;
  });

  const baseConfig: AppConfig = { ...DEFAULT_CONFIG };

  it('ANTHROPIC_API_KEY のみ設定時、AnthropicProvider が選択されること', () => {
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

    const result = ProviderFactory.create(baseConfig);

    expect(result.name).toBe('anthropic');
    expect(AnthropicProvider).toHaveBeenCalledOnce();
    expect(AnthropicProvider).toHaveBeenCalledWith('test-anthropic-key', expect.any(String));
    expect(GeminiProvider).not.toHaveBeenCalled();
    expect(OpenAICompatibleProvider).not.toHaveBeenCalled();
  });

  it('GEMINI_API_KEY のみ設定時、GeminiProvider が選択されること', () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';

    const result = ProviderFactory.create(baseConfig);

    expect(result.name).toBe('gemini');
    expect(GeminiProvider).toHaveBeenCalledOnce();
    expect(GeminiProvider).toHaveBeenCalledWith('test-gemini-key', expect.any(String));
    expect(AnthropicProvider).not.toHaveBeenCalled();
    expect(OpenAICompatibleProvider).not.toHaveBeenCalled();
  });

  it('GROQ_API_KEY のみ設定時、OpenAICompatibleProvider が選択され、name が "groq" であること', () => {
    process.env.GROQ_API_KEY = 'test-groq-key';

    const result = ProviderFactory.create(baseConfig);

    expect(result.name).toBe('groq');
    expect(OpenAICompatibleProvider).toHaveBeenCalledOnce();
    expect(OpenAICompatibleProvider).toHaveBeenCalledWith(
      'test-groq-key',
      expect.any(String),
      'https://api.groq.com/openai/v1',
    );
    expect(AnthropicProvider).not.toHaveBeenCalled();
    expect(GeminiProvider).not.toHaveBeenCalled();
  });

  it('OPENROUTER_API_KEY のみ設定時、OpenAICompatibleProvider が選択され、name が "openrouter" であること', () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';

    const result = ProviderFactory.create(baseConfig);

    expect(result.name).toBe('openrouter');
    expect(OpenAICompatibleProvider).toHaveBeenCalledOnce();
    expect(OpenAICompatibleProvider).toHaveBeenCalledWith(
      'test-openrouter-key',
      expect.any(String),
      'https://openrouter.ai/api/v1',
    );
    expect(AnthropicProvider).not.toHaveBeenCalled();
    expect(GeminiProvider).not.toHaveBeenCalled();
  });

  it('複数キーがある場合、優先順位（ANTHROPIC > GEMINI > GROQ > OPENROUTER）が保たれること', () => {
    // 全キーを設定
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.GROQ_API_KEY = 'test-groq-key';
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';

    const result1 = ProviderFactory.create(baseConfig);
    expect(result1.name).toBe('anthropic');

    vi.mocked(AnthropicProvider).mockClear();
    vi.mocked(GeminiProvider).mockClear();
    vi.mocked(OpenAICompatibleProvider).mockClear();

    // ANTHROPIC を外して GEMINI が優先されることを確認
    delete process.env.ANTHROPIC_API_KEY;
    const result2 = ProviderFactory.create(baseConfig);
    expect(result2.name).toBe('gemini');

    vi.mocked(GeminiProvider).mockClear();
    vi.mocked(OpenAICompatibleProvider).mockClear();

    // GEMINI も外して GROQ が優先されることを確認
    delete process.env.GEMINI_API_KEY;
    const result3 = ProviderFactory.create(baseConfig);
    expect(result3.name).toBe('groq');
  });

  it('いずれのキーも未設定のとき、利用可能な環境変数名を含むエラーが throw されること', () => {
    expect(() => ProviderFactory.create(baseConfig)).toThrowError(
      /ANTHROPIC_API_KEY.*GEMINI_API_KEY.*GROQ_API_KEY.*OPENROUTER_API_KEY/,
    );
  });

  it('config.provider を明示指定したとき、そのプロバイダーが使われること', () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    // ANTHROPIC_API_KEY は未設定だが provider を明示指定して anthropic を試みると、
    // キーがないのでエラー。なのでここでは gemini を明示指定するケースを検証する
    const config: AppConfig = { ...baseConfig, provider: 'gemini' };

    const result = ProviderFactory.create(config);

    expect(result.name).toBe('gemini');
    expect(GeminiProvider).toHaveBeenCalledOnce();
    expect(GeminiProvider).toHaveBeenCalledWith('test-gemini-key', expect.any(String));
    expect(AnthropicProvider).not.toHaveBeenCalled();
  });

  it('config.provider に対応するキーがないとき、適切なエラーが throw されること', () => {
    // ANTHROPIC_API_KEY は設定しない
    const config: AppConfig = { ...baseConfig, provider: 'anthropic' };

    expect(() => ProviderFactory.create(config)).toThrowError(
      /ANTHROPIC_API_KEY 環境変数を設定してください/,
    );
  });

  it('config.model がデフォルトモデルと異なるとき、指定モデルがそのまま使われること', () => {
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    const customModel = 'claude-3-opus-20240229';
    const config: AppConfig = { ...baseConfig, model: customModel };

    const result = ProviderFactory.create(config);

    expect(result.name).toBe('anthropic');
    expect(AnthropicProvider).toHaveBeenCalledWith('test-anthropic-key', customModel);
    expect(result.provider.modelId).toBe(customModel);
  });
});

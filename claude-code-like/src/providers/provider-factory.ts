import type { Provider, AppConfig, ProviderName } from '../types/index.js';
import { AnthropicProvider } from './anthropic.js';
import { GeminiProvider } from './gemini.js';
import { OpenAICompatibleProvider } from './openai-compatible.js';

interface ProviderEntry {
  name: ProviderName;
  envKey: string;
  defaultModel: string;
  create: (apiKey: string, model: string) => Provider;
}

const PROVIDERS: ProviderEntry[] = [
  {
    name: 'anthropic',
    envKey: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-sonnet-4-20250514',
    create: (key, model) => new AnthropicProvider(key, model),
  },
  {
    name: 'gemini',
    envKey: 'GEMINI_API_KEY',
    defaultModel: 'gemini-2.5-flash',
    create: (key, model) => new GeminiProvider(key, model),
  },
  {
    name: 'groq',
    envKey: 'GROQ_API_KEY',
    defaultModel: 'llama-3.3-70b-versatile',
    create: (key, model) => new OpenAICompatibleProvider(key, model, 'https://api.groq.com/openai/v1'),
  },
  {
    name: 'openrouter',
    envKey: 'OPENROUTER_API_KEY',
    defaultModel: 'qwen/qwen3-coder:free',
    create: (key, model) => new OpenAICompatibleProvider(key, model, 'https://openrouter.ai/api/v1'),
  },
];

export interface ProviderInfo {
  provider: Provider;
  name: ProviderName;
}

export class ProviderFactory {
  static create(config: AppConfig): ProviderInfo {
    // 明示的にプロバイダーが指定された場合
    if (config.provider) {
      const entry = PROVIDERS.find((p) => p.name === config.provider);
      if (!entry) {
        throw new Error(`未対応のプロバイダーです: ${config.provider}`);
      }
      const apiKey = process.env[entry.envKey];
      if (!apiKey) {
        throw new Error(`${entry.envKey} 環境変数を設定してください`);
      }
      const model = config.model || entry.defaultModel;
      return { provider: entry.create(apiKey, model), name: entry.name };
    }

    // 環境変数から優先順位で自動検出: ANTHROPIC > GEMINI > GROQ > OPENROUTER
    for (const entry of PROVIDERS) {
      const apiKey = process.env[entry.envKey];
      if (apiKey) {
        const model = config.model || entry.defaultModel;
        return { provider: entry.create(apiKey, model), name: entry.name };
      }
    }

    const envKeys = PROVIDERS.map((p) => p.envKey).join(', ');
    throw new Error(
      `API キーが設定されていません。以下のいずれかの環境変数を設定してください: ${envKeys}`,
    );
  }
}

import type { Provider, AppConfig } from '../types/index.js';
import { AnthropicProvider } from './anthropic.js';

export class ProviderFactory {
  static create(config: AppConfig): Provider {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY 環境変数を設定してください');
    }
    return new AnthropicProvider(apiKey, config.model);
  }
}

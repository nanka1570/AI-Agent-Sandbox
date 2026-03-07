import { vi } from 'vitest';
import type { Provider, LLMResponse } from '../../src/types/index.js';

export type MockResponse = {
  content: Array<
    | { type: 'text'; text: string }
    | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  >;
  stop_reason: string;
};

export function createMockProvider(responses: MockResponse[]): Provider {
  let callIndex = 0;
  return {
    modelId: 'mock-model',
    createMessage: vi.fn().mockImplementation(async (): Promise<LLMResponse> => {
      const response = responses[callIndex++];
      if (!response) {
        throw new Error('No more mock responses');
      }
      return {
        content: response.content,
        stop_reason: response.stop_reason,
      };
    }),
  };
}

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// ResizeObserver のモック（Radix UI コンポーネントが使用）
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// 各テスト後にDOMをクリーンアップ
afterEach(() => {
  cleanup();
});

'use client';

import { useEffect } from 'react';

/**
 * サービスワーカー登録コンポーネント
 * クライアントサイドでSWを登録する
 */
export function SwRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
        console.error('サービスワーカー登録エラー:', error);
      });
    }
  }, []);

  return null;
}

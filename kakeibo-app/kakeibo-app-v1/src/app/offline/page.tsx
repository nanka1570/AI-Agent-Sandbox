'use client';

/**
 * オフラインフォールバックページ
 * ネットワーク接続がない場合にサービスワーカーから返される
 * (main) ルートグループの外にあるため、ナビゲーションなしで全画面表示される
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 py-12">
      {/* アプリ名 */}
      <p className="text-sm font-black tracking-widest text-muted-foreground">家計簿 APP</p>

      {/* Wi-Fiオフアイコン */}
      <div className="flex h-28 w-28 items-center justify-center border-4 border-border bg-amber-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="2" y1="2" x2="22" y2="22" />
          <path d="M8.5 16.5a5 5 0 0 1 7 0" />
          <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
          <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
          <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68" />
          <path d="M5 12.86a10 10 0 0 1 5.17-2.89" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>

      {/* メッセージ */}
      <div className="text-center">
        <h1 className="mb-4 border-4 border-border bg-white px-8 py-4 text-3xl font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          オフラインです
        </h1>
        <p className="mt-4 text-base font-bold text-muted-foreground">
          インターネット接続を確認して、
          <br />
          ページをリロードしてください。
        </p>
      </div>

      {/* リロードボタン */}
      <button
        onClick={() => window.location.reload()}
        className="cursor-pointer border-4 border-border bg-indigo-500 px-10 py-3 text-lg font-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
      >
        リロードする
      </button>
    </div>
  );
}

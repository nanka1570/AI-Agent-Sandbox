import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-muted-foreground">ページが見つかりませんでした</p>
      <Link href="/" className="text-sm underline">
        トップに戻る
      </Link>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー | 家計簿アプリ",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="border-b-4 border-border pb-4 text-2xl font-black">
        プライバシーポリシー
      </h1>

      <div className="mt-6 space-y-8 text-sm leading-relaxed text-foreground/90">
        {/* 収集する情報 */}
        <section>
          <h2 className="mb-3 text-lg font-black">1. 収集する情報</h2>
          <p>当アプリでは、以下の情報を収集します。</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>メールアドレス（アカウント登録・認証のため）</li>
            <li>支出データ（クレジットカード情報、給料情報、支払い情報など、家計管理のため）</li>
            <li>カテゴリ・予算設定（家計分析のため）</li>
          </ul>
        </section>

        {/* 利用目的 */}
        <section>
          <h2 className="mb-3 text-lg font-black">2. 利用目的</h2>
          <p>収集した情報は、以下の目的で利用します。</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>ユーザー認証およびアカウント管理</li>
            <li>家計データの記録・表示・分析機能の提供</li>
            <li>サービスの改善および新機能の開発</li>
          </ul>
        </section>

        {/* 第三者提供 */}
        <section>
          <h2 className="mb-3 text-lg font-black">3. 第三者への提供</h2>
          <p>
            当アプリは、ユーザーの個人情報を第三者に販売・提供することはありません。
            ただし、以下の場合を除きます。
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              広告配信のため、Google AdSense を利用する場合があります。
              Google は Cookie を使用して、ユーザーの興味に基づく広告を配信することがあります。
            </li>
            <li>法令に基づく開示請求があった場合</li>
          </ul>
        </section>

        {/* データ保管・削除 */}
        <section>
          <h2 className="mb-3 text-lg font-black">4. データの保管と削除</h2>
          <p>
            ユーザーのデータは、サービス提供に必要な期間保管されます。
            アカウントを削除した場合、関連するすべてのデータは速やかに削除されます。
          </p>
        </section>

        {/* セキュリティ */}
        <section>
          <h2 className="mb-3 text-lg font-black">5. セキュリティ</h2>
          <p>
            当アプリは、ユーザーのデータを保護するために適切な技術的・組織的措置を講じています。
            ただし、インターネット上の通信において完全な安全性を保証するものではありません。
          </p>
        </section>

        {/* お問い合わせ先 */}
        <section>
          <h2 className="mb-3 text-lg font-black">6. お問い合わせ</h2>
          <p>
            本ポリシーに関するお問い合わせは、アプリ内のお問い合わせ機能
            またはメールにてご連絡ください。
          </p>
        </section>

        {/* 改定 */}
        <section>
          <h2 className="mb-3 text-lg font-black">7. ポリシーの変更</h2>
          <p>
            当アプリは、必要に応じて本ポリシーを変更することがあります。
            変更があった場合は、アプリ内で通知します。
          </p>
        </section>

        <p className="text-xs text-muted-foreground">最終更新日: 2026年2月20日</p>
      </div>

      <div className="mt-8 border-t-2 border-border pt-4">
        <Link
          href="/"
          className="text-sm font-bold text-primary hover:underline"
        >
          ダッシュボードに戻る
        </Link>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "利用規約 | 家計簿アプリ",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="border-b-4 border-border pb-4 text-2xl font-black">
        利用規約
      </h1>

      <div className="mt-6 space-y-8 text-sm leading-relaxed text-foreground/90">
        {/* サービスの内容 */}
        <section>
          <h2 className="mb-3 text-lg font-black">1. サービスの内容</h2>
          <p>
            本サービスは、クレジットカードの支払い管理や給料管理を通じて、
            家計の把握を支援する Web アプリケーションです。
            ユーザーは、支出の記録、カテゴリ別の予算管理、月次レポートの閲覧などの機能を利用できます。
          </p>
        </section>

        {/* アカウント */}
        <section>
          <h2 className="mb-3 text-lg font-black">2. アカウント</h2>
          <p>
            本サービスの利用にはアカウント登録が必要です。
            ユーザーは、正確な情報を登録し、アカウントの管理について責任を負います。
            パスワードの漏洩や不正利用が判明した場合は、速やかにご連絡ください。
          </p>
        </section>

        {/* 禁止事項 */}
        <section>
          <h2 className="mb-3 text-lg font-black">3. 禁止事項</h2>
          <p>ユーザーは、以下の行為を行ってはなりません。</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>法令または公序良俗に違反する行為</li>
            <li>サービスの運営を妨害する行為</li>
            <li>他のユーザーの情報を不正に取得する行為</li>
            <li>サービスのリバースエンジニアリングやスクレイピング</li>
            <li>不正アクセスやセキュリティを侵害する行為</li>
            <li>その他、運営者が不適切と判断する行為</li>
          </ul>
        </section>

        {/* 免責事項 */}
        <section>
          <h2 className="mb-3 text-lg font-black">4. 免責事項</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              本サービスは「現状有姿」で提供されます。
              運営者は、サービスの正確性、完全性、信頼性について保証しません。
            </li>
            <li>
              本サービスの利用によって生じた損害について、運営者は一切の責任を負いません。
            </li>
            <li>
              家計データはあくまで参考情報であり、
              金融上の意思決定は自己責任で行ってください。
            </li>
            <li>
              サービスの一時停止、中断、終了について、運営者は事前の通知なく行う場合があります。
            </li>
          </ul>
        </section>

        {/* 利用規約の変更 */}
        <section>
          <h2 className="mb-3 text-lg font-black">5. 利用規約の変更</h2>
          <p>
            運営者は、必要に応じて本規約を変更することがあります。
            変更後の規約は、アプリ内での掲示をもって効力を生じます。
            変更後も本サービスを利用し続ける場合、変更後の規約に同意したものとみなします。
          </p>
        </section>

        {/* お問い合わせ先 */}
        <section>
          <h2 className="mb-3 text-lg font-black">6. お問い合わせ</h2>
          <p>
            本規約に関するお問い合わせは、アプリ内のお問い合わせ機能
            またはメールにてご連絡ください。
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

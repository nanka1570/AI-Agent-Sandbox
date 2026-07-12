// Claude API で年次報告書の抜粋から定性情報（国別売上・事業構成）を抽出する
// API キー未設定でもアプリ全体は動作し、この機能だけが「未設定」表示になる
import Anthropic from "@anthropic-ai/sdk";
import {
  extractRelevantExcerpts,
  fetchFilingText,
  findLatestAnnualFiling,
} from "./edgar";

// 抽出タスクは軽量モデルで十分（コスト優先の要件により Haiku を既定にする。
// 1 銘柄あたり約 1〜2 円。精度を上げたい場合は .env.local の AI_MODEL で差し替え）
const AI_MODEL = process.env.AI_MODEL ?? "claude-haiku-4-5";

// 課金開始後に .env.local へ ANTHROPIC_API_KEY を設定すると有効になる
export function isAiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

// 10-K から関連箇所を探すキーワード（地域別売上・セグメント情報の定型見出し）
const EXCERPT_KEYWORDS = [
  "china",
  "taiwan",
  "geographic",
  "by region",
  "revenue by",
  "segment information",
  "disaggregat",
];

const SYSTEM_PROMPT = `あなたは個人投資家の分析アシスタント。米国企業の年次報告書（10-K / 20-F / 40-F）の抜粋から、以下を抽出して日本語の簡潔なメモを作る。

抽出対象:
1. 国別・地域別の売上構成（特に中国比率。数値があれば % で）
2. 事業構成（製品・装置販売 vs サービス・保守などの売上内訳）
3. 地政学リスクに関する重要な記述（あれば）

規則:
- 抜粋に書かれていることだけを使い、推測や一般知識で補わない
- 数値には「何の数値か」を短く添える（例: 中国売上比率: 17%（FY2025））
- 抜粋から読み取れない項目は「抜粋からは不明」と書く
- 箇条書きで 10 行以内。前置きや結びの文は書かない`;

export interface MemoDraftResult {
  draft: string;
  source: { form: string; filedAt: string; url: string };
}

export async function generateMemoDraftFromFiling(
  ticker: string
): Promise<MemoDraftResult> {
  if (!isAiConfigured()) {
    throw new Error(
      "ANTHROPIC_API_KEY が未設定です（.env.local に設定すると使えます）"
    );
  }

  const filing = await findLatestAnnualFiling(ticker);
  if (!filing) {
    throw new Error(`${ticker} の年次報告書が SEC EDGAR で見つかりませんでした`);
  }

  const text = await fetchFilingText(filing.url);
  const excerpts = extractRelevantExcerpts(text, EXCERPT_KEYWORDS);
  if (excerpts === "") {
    throw new Error(
      "年次報告書から関連箇所（地域別売上等）を見つけられませんでした"
    );
  }

  const client = new Anthropic(); // ANTHROPIC_API_KEY を環境変数から読む
  let response: Anthropic.Message;
  try {
    response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `${ticker} の ${filing.form}（${filing.filedAt} 提出）の抜粋:\n\n${excerpts}`,
        },
      ],
    });
  } catch (error) {
    throw new Error(toFriendlyApiError(error));
  }

  const body = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
  if (body === "") {
    throw new Error("AI からの応答が空でした。再実行してください");
  }

  const draft = [
    body,
    "---",
    `出典: ${filing.form}（${filing.filedAt} 提出） ${filing.url}`,
    "（AI 抽出の下書き。保存前に原文と照合すること）",
  ].join("\n");

  return { draft, source: filing };
}

// SDK の型付き例外を利用者向けの日本語メッセージに変換する
function toFriendlyApiError(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) {
    return "API キーが無効です。ANTHROPIC_API_KEY を確認してください";
  }
  if (error instanceof Anthropic.RateLimitError) {
    return "API のレート制限に達しました。しばらく待って再実行してください";
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return "Anthropic API に接続できませんでした。ネットワークを確認してください";
  }
  if (error instanceof Anthropic.APIError) {
    return `Anthropic API エラー（${error.status}）: ${error.message}`;
  }
  return error instanceof Error ? error.message : "AI 抽出に失敗しました";
}

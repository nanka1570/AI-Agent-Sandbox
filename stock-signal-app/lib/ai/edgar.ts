// SEC EDGAR（無料・キー不要）から年次報告書を取得する
// 10-K（米国企業）に加え、20-F / 40-F（ADR・外国企業）にも対応する

// SEC はアクセス元の明示（User-Agent に連絡先）を要求している
const SEC_HEADERS = {
  "User-Agent": "stock-signal-app/1.0 (personal research tool; contact: nanka1570@gmail.com)",
};

const ANNUAL_FORMS = ["10-K", "20-F", "40-F"];

export interface FilingInfo {
  form: string; // "10-K" など
  filedAt: string; // 提出日 "YYYY-MM-DD"
  url: string; // 原文（HTML）の URL
}

// ティッカー → CIK（SEC の企業識別番号）の対応表。1 日キャッシュ
let cikCache: { map: Map<string, string>; fetchedAt: number } | null = null;
const CIK_TTL_MS = 24 * 60 * 60 * 1000;

async function tickerToCik(ticker: string): Promise<string | null> {
  if (!cikCache || Date.now() - cikCache.fetchedAt > CIK_TTL_MS) {
    const res = await fetch("https://www.sec.gov/files/company_tickers.json", {
      headers: SEC_HEADERS,
    });
    if (!res.ok) throw new Error(`SEC ティッカー一覧の取得に失敗: ${res.status}`);
    const json = (await res.json()) as Record<
      string,
      { cik_str: number; ticker: string }
    >;
    const map = new Map<string, string>();
    for (const entry of Object.values(json)) {
      map.set(entry.ticker.toUpperCase(), String(entry.cik_str));
    }
    cikCache = { map, fetchedAt: Date.now() };
  }
  return cikCache.map.get(ticker.toUpperCase()) ?? null;
}

// 直近の年次報告書（10-K / 20-F / 40-F）を探す
export async function findLatestAnnualFiling(
  ticker: string
): Promise<FilingInfo | null> {
  const cik = await tickerToCik(ticker);
  if (!cik) return null;

  const padded = cik.padStart(10, "0");
  const res = await fetch(`https://data.sec.gov/submissions/CIK${padded}.json`, {
    headers: SEC_HEADERS,
  });
  if (!res.ok) throw new Error(`SEC 提出書類一覧の取得に失敗: ${res.status}`);
  const json = (await res.json()) as {
    filings?: {
      recent?: {
        form: string[];
        accessionNumber: string[];
        primaryDocument: string[];
        filingDate: string[];
      };
    };
  };
  const recent = json.filings?.recent;
  if (!recent) return null;

  for (let i = 0; i < recent.form.length; i++) {
    if (ANNUAL_FORMS.includes(recent.form[i])) {
      const accession = recent.accessionNumber[i].replace(/-/g, "");
      return {
        form: recent.form[i],
        filedAt: recent.filingDate[i],
        url: `https://www.sec.gov/Archives/edgar/data/${cik}/${accession}/${recent.primaryDocument[i]}`,
      };
    }
  }
  return null;
}

export async function fetchFilingText(url: string): Promise<string> {
  const res = await fetch(url, { headers: SEC_HEADERS });
  if (!res.ok) throw new Error(`年次報告書の取得に失敗: ${res.status}`);
  return htmlToText(await res.text());
}

// ── 以下は純粋関数（単体テスト対象） ──

// HTML をプレーンテキスト化する（抜粋検索に十分な精度の簡易実装）
// iXBRL 形式の年次報告書は <ix:header> に機械用の隠しメタデータ（数十万字）を持つため先に捨てる
export function htmlToText(html: string): string {
  return html
    .replace(/<ix:header[\s\S]*?<\/ix:header>/gi, " ")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// キーワード周辺の抜粋を集める
// 10-K は数十万字あるため、全文ではなく関連箇所だけを LLM に渡してコストを抑える
export function extractRelevantExcerpts(
  text: string,
  keywords: string[],
  windowSize = 1500,
  maxTotalChars = 20000,
  maxHitsPerKeyword = 8
): string {
  const lower = text.toLowerCase();
  const ranges: [number, number][] = [];

  for (const keyword of keywords) {
    const needle = keyword.toLowerCase();
    let from = 0;
    for (let hits = 0; hits < maxHitsPerKeyword; hits++) {
      const idx = lower.indexOf(needle, from);
      if (idx === -1) break;
      ranges.push([
        Math.max(0, idx - windowSize / 2),
        Math.min(text.length, idx + needle.length + windowSize / 2),
      ]);
      from = idx + needle.length;
    }
  }
  if (ranges.length === 0) return "";

  // 重複区間をマージして順序どおりに結合する
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [ranges[0]];
  for (const [start, end] of ranges.slice(1)) {
    const last = merged[merged.length - 1];
    if (start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }

  let result = "";
  for (const [start, end] of merged) {
    if (result.length >= maxTotalChars) break;
    const chunk = text.slice(start, end);
    result += (result ? "\n…\n" : "") + chunk;
  }
  return result.slice(0, maxTotalChars);
}

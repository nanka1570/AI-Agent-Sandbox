import { describe, expect, it } from "vitest";
import { NASDAQ100, SECTORS } from "@/lib/constants/nasdaq100";

// 銘柄リストは手動更新のため、編集ミスをここで検出する
// （更新手順は docs/maintenance.md を参照）
describe("NASDAQ100 銘柄リストの整合性", () => {
  it("ティッカーに重複がない", () => {
    const tickers = NASDAQ100.map((s) => s.ticker);
    expect(new Set(tickers).size).toBe(tickers.length);
  });

  it("ティッカーは大文字英字（ドット可）のみ", () => {
    for (const s of NASDAQ100) {
      expect(s.ticker).toMatch(/^[A-Z.]{1,6}$/);
    }
  });

  it("セクターはすべて SECTORS に定義済みの名前", () => {
    const valid = new Set<string>(SECTORS);
    for (const s of NASDAQ100) {
      expect(valid.has(s.sector), `${s.ticker} のセクター: ${s.sector}`).toBe(
        true
      );
    }
  });

  it("銘柄数は 100 前後（Alphabet 2 クラスで 101 が基準）", () => {
    expect(NASDAQ100.length).toBeGreaterThanOrEqual(95);
    expect(NASDAQ100.length).toBeLessThanOrEqual(105);
  });

  it("銘柄名が空でない", () => {
    for (const s of NASDAQ100) {
      expect(s.name.length).toBeGreaterThan(0);
    }
  });
});

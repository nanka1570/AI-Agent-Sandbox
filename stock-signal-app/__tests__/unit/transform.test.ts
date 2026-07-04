import { describe, expect, it } from "vitest";
import {
  mapChartQuotes,
  toUtcMidnight,
  type RawQuote,
} from "@/lib/data/transform";

function quote(overrides: Partial<RawQuote> = {}): RawQuote {
  return {
    date: new Date("2026-07-01T13:30:00Z"),
    open: 100,
    high: 110,
    low: 95,
    close: 105,
    adjclose: 104,
    volume: 1_000_000,
    ...overrides,
  };
}

describe("toUtcMidnight", () => {
  it("時刻を UTC 00:00 に切り捨てる", () => {
    const result = toUtcMidnight(new Date("2026-07-01T13:30:00Z"));
    expect(result.toISOString()).toBe("2026-07-01T00:00:00.000Z");
  });

  it("UTC 基準で日付を決める（前日の深夜でも日付が変わらない）", () => {
    const result = toUtcMidnight(new Date("2026-07-01T04:00:00Z"));
    expect(result.toISOString()).toBe("2026-07-01T00:00:00.000Z");
  });
});

describe("mapChartQuotes", () => {
  it("正常な行を PriceRow に変換する", () => {
    const rows = mapChartQuotes([quote()]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      date: new Date("2026-07-01T00:00:00Z"),
      open: 100,
      high: 110,
      low: 95,
      close: 105,
      adjClose: 104,
      volume: 1_000_000,
    });
  });

  it("null を含む欠損行は除外する", () => {
    const rows = mapChartQuotes([quote(), quote({ close: null })]);
    expect(rows).toHaveLength(1);
  });

  it("adjclose がない場合は close を採用する", () => {
    const rows = mapChartQuotes([quote({ adjclose: undefined })]);
    expect(rows[0].adjClose).toBe(105);
  });

  it("同一日の重複は後の行を採用し、日付昇順で返す", () => {
    const rows = mapChartQuotes([
      quote({ date: new Date("2026-07-02T13:30:00Z"), close: 200 }),
      quote({ date: new Date("2026-07-01T13:30:00Z"), close: 105 }),
      quote({ date: new Date("2026-07-02T20:00:00Z"), close: 210 }),
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0].date.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(rows[1].close).toBe(210);
  });
});

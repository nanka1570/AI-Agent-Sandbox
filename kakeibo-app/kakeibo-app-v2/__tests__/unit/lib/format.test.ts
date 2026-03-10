import { describe, it, expect } from "vitest";
import { formatDay, formatCurrency, formatMonth } from "@/lib/utils/format";

describe("formatDay", () => {
  it("LAST_DAY_CODE（32）は「末日」と表示する", () => {
    expect(formatDay(32)).toBe("末日");
  });

  it("通常の日付は「N日」形式で表示する", () => {
    expect(formatDay(25)).toBe("25日");
  });

  it("1日は「1日」と表示する", () => {
    expect(formatDay(1)).toBe("1日");
  });
});

describe("formatCurrency", () => {
  it("金額を日本円形式で表示する", () => {
    expect(formatCurrency(250000)).toBe("￥250,000");
  });

  it("0円を正しく表示する", () => {
    expect(formatCurrency(0)).toBe("￥0");
  });

  it("負の金額を正しく表示する", () => {
    expect(formatCurrency(-1000)).toBe("-￥1,000");
  });

  it("小数点以下は四捨五入される", () => {
    // JPY は小数点なし
    const result = formatCurrency(1234.5);
    expect(result).toBe("￥1,235");
  });
});

describe("formatMonth", () => {
  it("yyyy-MM形式を日本語表記に変換する", () => {
    expect(formatMonth("2026-03")).toBe("2026年3月");
  });

  it("先頭ゼロを除去して表示する（01月→1月）", () => {
    expect(formatMonth("2026-01")).toBe("2026年1月");
  });

  it("12月を正しく変換する", () => {
    expect(formatMonth("2026-12")).toBe("2026年12月");
  });

  it("不正な形式はそのまま返す", () => {
    expect(formatMonth("invalid")).toBe("invalid");
  });

  it("空文字はそのまま返す", () => {
    expect(formatMonth("")).toBe("");
  });

  it("ハイフンなしの数字はそのまま返す", () => {
    expect(formatMonth("202603")).toBe("202603");
  });
});

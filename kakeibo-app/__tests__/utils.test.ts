import { describe, it, expect } from "vitest";
import { formatCurrencyJP, formatPaymentDay } from "@/lib/utils";

describe("formatCurrencyJP", () => {
  it("0円は空文字を返す", () => {
    expect(formatCurrencyJP(0)).toBe("");
  });

  it("1万円未満はXXX円形式", () => {
    expect(formatCurrencyJP(3000)).toBe("3,000円");
  });

  it("ちょうど1万円は1万円", () => {
    expect(formatCurrencyJP(10000)).toBe("1万円");
  });

  it("25万円はちょうど25万円", () => {
    expect(formatCurrencyJP(250000)).toBe("25万円");
  });

  it("25万3000円は25万3,000円", () => {
    expect(formatCurrencyJP(253000)).toBe("25万3,000円");
  });

  it("負の値は空文字を返す", () => {
    expect(formatCurrencyJP(-1000)).toBe("");
  });
});

describe("formatPaymentDay", () => {
  it("offset=0は当月XX日", () => {
    expect(formatPaymentDay(27, 0)).toBe("当月27日");
  });

  it("offset=1は翌月XX日", () => {
    expect(formatPaymentDay(10, 1)).toBe("翌月10日");
  });

  it("offset=2は翌々月XX日", () => {
    expect(formatPaymentDay(4, 2)).toBe("翌々月4日");
  });
});

import { describe, it, expect } from "vitest";
import {
  resolveDay,
  getDateFromMonthAndDay,
  addMonthsToMonth,
  getAdjacentMonths,
} from "@/lib/utils/date";

describe("resolveDay", () => {
  it("月の末日を超える場合は末日に丸める（2月31日→28日）", () => {
    expect(resolveDay(31, 2026, 2)).toBe(28);
  });

  it("月の末日以内の場合はそのまま返す", () => {
    expect(resolveDay(15, 2026, 3)).toBe(15);
  });

  it("うるう年の2月29日は29を返す", () => {
    expect(resolveDay(29, 2024, 2)).toBe(29);
  });

  it("うるう年でない2月29日は28に丸める", () => {
    expect(resolveDay(29, 2026, 2)).toBe(28);
  });

  it("1日は常にそのまま返す", () => {
    expect(resolveDay(1, 2026, 1)).toBe(1);
  });

  it("30日の月に31日を指定すると30に丸める", () => {
    // 4月は30日まで
    expect(resolveDay(31, 2026, 4)).toBe(30);
  });
});

describe("getDateFromMonthAndDay", () => {
  it("通常の日付を正しく生成する", () => {
    const result = getDateFromMonthAndDay("2026-03", 15);
    expect(result).toEqual(new Date(2026, 2, 15));
  });

  it("末日を超える日は丸められる（2月31日→28日）", () => {
    const result = getDateFromMonthAndDay("2026-02", 31);
    expect(result).toEqual(new Date(2026, 1, 28));
  });

  it("1月1日を正しく生成する", () => {
    const result = getDateFromMonthAndDay("2026-01", 1);
    expect(result).toEqual(new Date(2026, 0, 1));
  });

  it("12月31日を正しく生成する", () => {
    const result = getDateFromMonthAndDay("2026-12", 31);
    expect(result).toEqual(new Date(2026, 11, 31));
  });
});

describe("addMonthsToMonth", () => {
  it("1ヶ月加算する", () => {
    expect(addMonthsToMonth("2026-03", 1)).toBe("2026-04");
  });

  it("年をまたいで加算する（12月→翌年1月）", () => {
    expect(addMonthsToMonth("2026-12", 1)).toBe("2027-01");
  });

  it("オフセット0はそのまま返す", () => {
    expect(addMonthsToMonth("2026-05", 0)).toBe("2026-05");
  });

  it("負のオフセットで減算する", () => {
    expect(addMonthsToMonth("2026-03", -1)).toBe("2026-02");
  });

  it("年をまたいで減算する（1月→前年12月）", () => {
    expect(addMonthsToMonth("2026-01", -1)).toBe("2025-12");
  });
});

describe("getAdjacentMonths", () => {
  it("前後の月を正しく取得する", () => {
    const result = getAdjacentMonths("2026-03", [-2, -1, 0, 1]);
    expect(result).toEqual(["2026-01", "2026-02", "2026-03", "2026-04"]);
  });

  it("空の範囲は空配列を返す", () => {
    expect(getAdjacentMonths("2026-03", [])).toEqual([]);
  });

  it("年をまたぐ範囲も正しく処理する", () => {
    const result = getAdjacentMonths("2026-01", [-1, 0, 1]);
    expect(result).toEqual(["2025-12", "2026-01", "2026-02"]);
  });
});

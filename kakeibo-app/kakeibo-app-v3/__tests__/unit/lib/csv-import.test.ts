import { describe, it, expect } from "vitest";
import { parseCsv, applyMapping } from "@/lib/utils/csv-import";

const SAMPLE = `利用日,金額,摘要
2026/04/01,3500,スーパー
2026-04-05,"12,800",家電量販店
2026.04.10,"¥2,000",ガソリン`;

describe("parseCsv", () => {
  it("ヘッダーと行を抽出する", () => {
    const r = parseCsv(SAMPLE);
    expect(r.headers).toEqual(["利用日", "金額", "摘要"]);
    expect(r.rows).toHaveLength(3);
  });
});

describe("applyMapping", () => {
  it("複数の日付フォーマットを正規化する", () => {
    const r = parseCsv(SAMPLE);
    const { items, errors } = applyMapping(r.rows, {
      dateColumn: "利用日",
      amountColumn: "金額",
      memoColumn: "摘要",
    });
    expect(errors).toHaveLength(0);
    expect(items).toHaveLength(3);
    expect(items[0].usageDate).toBe("2026-04-01");
    expect(items[1].usageDate).toBe("2026-04-05");
    expect(items[2].usageDate).toBe("2026-04-10");
  });

  it("金額のカンマ・円記号を除去する", () => {
    const r = parseCsv(SAMPLE);
    const { items } = applyMapping(r.rows, {
      dateColumn: "利用日",
      amountColumn: "金額",
    });
    expect(items[0].amount).toBe(3500);
    expect(items[1].amount).toBe(12800);
    expect(items[2].amount).toBe(2000);
  });

  it("不正な行はエラーに集める", () => {
    const badCsv = `日付,額\n2026-04-01,\n,1000\nhogehoge,bar`;
    const r = parseCsv(badCsv);
    const { items, errors } = applyMapping(r.rows, {
      dateColumn: "日付",
      amountColumn: "額",
    });
    expect(items).toHaveLength(0);
    expect(errors.length).toBeGreaterThan(0);
  });
});

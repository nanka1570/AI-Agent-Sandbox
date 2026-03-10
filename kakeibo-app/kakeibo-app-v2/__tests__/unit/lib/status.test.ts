import { describe, it, expect, vi } from "vitest";
import { isPaymentStatus, getNextStatus } from "@/lib/utils/status";

// getNowJST をモックして determineAutoStatus をテストする
vi.mock("@/lib/utils/date", async () => {
  const actual = await vi.importActual<typeof import("@/lib/utils/date")>(
    "@/lib/utils/date",
  );
  return {
    ...actual,
    getNowJST: vi.fn(),
  };
});

describe("isPaymentStatus", () => {
  it("有効なステータス 'unconfirmed' は true を返す", () => {
    expect(isPaymentStatus("unconfirmed")).toBe(true);
  });

  it("有効なステータス 'confirmed' は true を返す", () => {
    expect(isPaymentStatus("confirmed")).toBe(true);
  });

  it("有効なステータス 'paid' は true を返す", () => {
    expect(isPaymentStatus("paid")).toBe(true);
  });

  it("無効なステータスは false を返す", () => {
    expect(isPaymentStatus("invalid")).toBe(false);
  });

  it("空文字は false を返す", () => {
    expect(isPaymentStatus("")).toBe(false);
  });
});

describe("getNextStatus", () => {
  it("unconfirmed の次は confirmed", () => {
    expect(getNextStatus("unconfirmed")).toBe("confirmed");
  });

  it("confirmed の次は paid", () => {
    expect(getNextStatus("confirmed")).toBe("paid");
  });

  it("paid の次は unconfirmed（循環する）", () => {
    expect(getNextStatus("paid")).toBe("unconfirmed");
  });
});

describe("determineAutoStatus", () => {
  it("引き落とし日が過去の場合は paid を返す", async () => {
    const { getNowJST } = await import("@/lib/utils/date");
    // 2026-03-15 を「今日」とする
    vi.mocked(getNowJST).mockReturnValue(new Date(2026, 2, 15));

    const { determineAutoStatus } = await import("@/lib/utils/status");

    const result = determineAutoStatus({
      usageMonth: "2026-01",
      paymentMonthOffset: 1,
      paymentDay: 10, // 引き落とし日: 2026-02-10（過去）
      confirmationDay: null,
      confirmationMonthOffset: null,
    });
    expect(result).toBe("paid");
  });

  it("引き落とし日が当日の場合は paid を返す", async () => {
    const { getNowJST } = await import("@/lib/utils/date");
    vi.mocked(getNowJST).mockReturnValue(new Date(2026, 1, 27));

    const { determineAutoStatus } = await import("@/lib/utils/status");

    const result = determineAutoStatus({
      usageMonth: "2026-01",
      paymentMonthOffset: 1,
      paymentDay: 27, // 引き落とし日: 2026-02-27（当日）
      confirmationDay: null,
      confirmationMonthOffset: null,
    });
    expect(result).toBe("paid");
  });

  it("確定日が過去で引き落とし日が未来の場合は confirmed を返す", async () => {
    const { getNowJST } = await import("@/lib/utils/date");
    // 2026-02-20 を「今日」とする
    vi.mocked(getNowJST).mockReturnValue(new Date(2026, 1, 20));

    const { determineAutoStatus } = await import("@/lib/utils/status");

    const result = determineAutoStatus({
      usageMonth: "2026-01",
      paymentMonthOffset: 1,
      paymentDay: 27, // 引き落とし日: 2026-02-27（未来）
      confirmationDay: 15, // 確定日: 2026-02-15（過去）
      confirmationMonthOffset: 1,
    });
    expect(result).toBe("confirmed");
  });

  it("確定日も引き落とし日も未来の場合は unconfirmed を返す", async () => {
    const { getNowJST } = await import("@/lib/utils/date");
    // 2026-01-05 を「今日」とする
    vi.mocked(getNowJST).mockReturnValue(new Date(2026, 0, 5));

    const { determineAutoStatus } = await import("@/lib/utils/status");

    const result = determineAutoStatus({
      usageMonth: "2026-01",
      paymentMonthOffset: 1,
      paymentDay: 27, // 引き落とし日: 2026-02-27（未来）
      confirmationDay: 15, // 確定日: 2026-02-15（未来）
      confirmationMonthOffset: 1,
    });
    expect(result).toBe("unconfirmed");
  });

  it("確定日がnullの場合は確定チェックをスキップする", async () => {
    const { getNowJST } = await import("@/lib/utils/date");
    // 引き落とし日は未来
    vi.mocked(getNowJST).mockReturnValue(new Date(2026, 1, 20));

    const { determineAutoStatus } = await import("@/lib/utils/status");

    const result = determineAutoStatus({
      usageMonth: "2026-01",
      paymentMonthOffset: 1,
      paymentDay: 27, // 引き落とし日: 2026-02-27（未来）
      confirmationDay: null,
      confirmationMonthOffset: null,
    });
    expect(result).toBe("unconfirmed");
  });
});

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { determineAutoStatus, getNextStatus } from "@/lib/utils/status";

describe("determineAutoStatus", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    // JST 2026-04-17 12:00 固定
    vi.setSystemTime(new Date("2026-04-17T03:00:00Z"));
  });
  afterAll(() => {
    vi.useRealTimers();
  });

  const base = {
    paymentMonthOffset: 1,
    paymentDay: 27,
    confirmationDay: 5,
    confirmationMonthOffset: 1,
  };

  it("支払日到来済みは paid", () => {
    // usageMonth=2026-02 → paymentDate=2026-03-27（既に過去）
    const s = determineAutoStatus({ ...base, usageMonth: "2026-02" });
    expect(s).toBe("paid");
  });

  it("確定日到来済み・支払日未到来は confirmed", () => {
    // usageMonth=2026-03 → confirmationDate=2026-04-05（過去） paymentDate=2026-04-27（未来）
    const s = determineAutoStatus({ ...base, usageMonth: "2026-03" });
    expect(s).toBe("confirmed");
  });

  it("確定日未到来は unconfirmed", () => {
    // usageMonth=2026-04 → confirmationDate=2026-05-05（未来）
    const s = determineAutoStatus({ ...base, usageMonth: "2026-04" });
    expect(s).toBe("unconfirmed");
  });

  it("confirmationDay が null のときは paid / unconfirmed のみ", () => {
    const params = {
      usageMonth: "2026-04",
      paymentMonthOffset: 1,
      paymentDay: 27,
      confirmationDay: null,
      confirmationMonthOffset: null,
    };
    // paymentDate=2026-05-27（未来）なので unconfirmed
    expect(determineAutoStatus(params)).toBe("unconfirmed");
  });
});

describe("getNextStatus", () => {
  it("unconfirmed → confirmed → paid → unconfirmed の循環", () => {
    expect(getNextStatus("unconfirmed")).toBe("confirmed");
    expect(getNextStatus("confirmed")).toBe("paid");
    expect(getNextStatus("paid")).toBe("unconfirmed");
  });
});

import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("Phase 1 スモークテスト", () => {
  it("cn ユーティリティが Tailwind クラスをマージできる", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

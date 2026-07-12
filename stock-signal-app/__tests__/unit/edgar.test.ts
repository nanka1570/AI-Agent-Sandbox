import { describe, expect, it } from "vitest";
import { extractRelevantExcerpts, htmlToText } from "@/lib/ai/edgar";

describe("htmlToText", () => {
  it("タグを除去してテキストだけにする", () => {
    expect(htmlToText("<p>Revenue in <b>China</b> was 17%</p>")).toBe(
      "Revenue in China was 17%"
    );
  });

  it("script/style の中身は捨てる", () => {
    expect(
      htmlToText("<script>var x = 'China';</script><p>Total revenue</p>")
    ).toBe("Total revenue");
  });

  it("HTML エンティティを変換し空白を正規化する", () => {
    expect(htmlToText("A&amp;B&nbsp;&nbsp;C\n\nD")).toBe("A&B C D");
  });
});

describe("extractRelevantExcerpts", () => {
  it("キーワード周辺だけを抜き出す", () => {
    const text = "x".repeat(5000) + " revenue from China was 17% " + "y".repeat(5000);
    const result = extractRelevantExcerpts(text, ["china"], 200, 20000);
    expect(result).toContain("China was 17%");
    expect(result.length).toBeLessThan(500); // 全文 1 万字は含まれない
  });

  it("近接するヒットは 1 つの抜粋にマージされる", () => {
    const text = "China ... Taiwan" + "z".repeat(3000);
    const result = extractRelevantExcerpts(text, ["china", "taiwan"], 200, 20000);
    expect(result).not.toContain("\n…\n"); // 区切りなし = マージ済み
  });

  it("離れたヒットは区切り付きで結合される", () => {
    const text =
      "China here" + "z".repeat(5000) + "geographic breakdown" + "z".repeat(5000);
    const result = extractRelevantExcerpts(
      text,
      ["china", "geographic"],
      200,
      20000
    );
    expect(result).toContain("\n…\n");
  });

  it("キーワードが見つからなければ空文字", () => {
    expect(extractRelevantExcerpts("nothing relevant", ["china"], 200, 20000)).toBe(
      ""
    );
  });

  it("合計文字数の上限を超えない", () => {
    const text = ("China " + "w".repeat(500)).repeat(100);
    const result = extractRelevantExcerpts(text, ["china"], 1500, 3000);
    expect(result.length).toBeLessThanOrEqual(3000);
  });
});

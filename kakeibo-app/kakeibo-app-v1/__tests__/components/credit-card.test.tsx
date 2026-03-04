import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreditCardList } from "@/components/credit-cards/credit-card-list";

// Server Actions をモック
vi.mock("@/lib/actions/credit-card", () => ({
  createCreditCard: vi.fn(),
  updateCreditCard: vi.fn(),
  deleteCreditCard: vi.fn(),
}));

// next/navigation をモック
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const mockCards = [
  {
    id: "c1",
    userId: "user-1",
    name: "楽天カード",
    closingDay: 31,
    paymentDay: 27,
    memo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "c2",
    userId: "user-1",
    name: "三井住友カード",
    closingDay: 15,
    paymentDay: 10,
    memo: "メインカード",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("CreditCardList", () => {
  // CT-CC-001: カード一覧表示
  it("カード2件が表示される", () => {
    render(<CreditCardList cards={mockCards} />);
    expect(screen.getByText("楽天カード")).toBeInTheDocument();
    expect(screen.getByText("三井住友カード")).toBeInTheDocument();
  });

  // CT-CC-002: 空状態表示
  it("カード0件で空状態メッセージ表示", () => {
    render(<CreditCardList cards={[]} />);
    expect(screen.getByText("クレジットカードが登録されていません")).toBeInTheDocument();
  });

  // CT-CC-003: 登録フォーム表示
  it("新規登録ボタンでダイアログ表示", async () => {
    const user = userEvent.setup();
    render(<CreditCardList cards={mockCards} />);
    await user.click(screen.getByText("+ 新規登録"));
    expect(screen.getByText("クレジットカード登録")).toBeInTheDocument();
  });

  // CT-CC-004: バリデーションエラー表示
  it("空のまま送信でバリデーションエラー", async () => {
    const user = userEvent.setup();
    render(<CreditCardList cards={mockCards} />);
    await user.click(screen.getByText("+ 新規登録"));
    await user.click(screen.getByText("登録する"));
    expect(await screen.findByText("カード名は必須です")).toBeInTheDocument();
  });

  // CT-CC-005: 削除確認ダイアログ
  it("削除ボタンで確認ダイアログ表示", async () => {
    const user = userEvent.setup();
    render(<CreditCardList cards={mockCards} />);
    // 最初のカードの削除ボタン（Trash2アイコン）
    const deleteButtons = screen.getAllByRole("button").filter(
      (btn) => btn.querySelector("svg.lucide-trash-2")
    );
    await user.click(deleteButtons[0]);
    expect(screen.getByText("このクレジットカードを削除しますか？")).toBeInTheDocument();
  });
});

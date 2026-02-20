import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SalaryList } from "@/components/salary/salary-list";

vi.mock("@/lib/actions/salary", () => ({
  createSalary: vi.fn(),
  updateSalary: vi.fn(),
  deleteSalary: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const mockSalaries = [
  {
    id: "s1",
    month: "2026-02",
    payDay: 25,
    amount: 250000,
    memo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "s2",
    month: "2026-01",
    payDay: 25,
    amount: 240000,
    memo: "ボーナス含む",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("SalaryList", () => {
  // CT-SL-001: テーブル一覧表示
  it("給料2件がテーブルに表示される", () => {
    render(<SalaryList salaries={mockSalaries} />);
    expect(screen.getByText("¥250,000")).toBeInTheDocument();
    expect(screen.getByText("¥240,000")).toBeInTheDocument();
  });

  // CT-SL-002: 空状態表示
  it("給料0件で空状態メッセージ表示", () => {
    render(<SalaryList salaries={[]} />);
    expect(screen.getByText("給料データがありません")).toBeInTheDocument();
  });

  // CT-SL-003: 金額フォーマット
  it("金額が¥250,000と表示される", () => {
    render(<SalaryList salaries={mockSalaries} />);
    expect(screen.getByText("¥250,000")).toBeInTheDocument();
  });

  // CT-SL-004: 月フォーマット
  it("月が2026年02月と表示される", () => {
    render(<SalaryList salaries={mockSalaries} />);
    expect(screen.getByText("2026年02月")).toBeInTheDocument();
  });

  // CT-SL-005: 登録フォーム表示
  it("新規登録ボタンでダイアログ表示", async () => {
    const user = userEvent.setup();
    render(<SalaryList salaries={mockSalaries} />);
    await user.click(screen.getByText("+ 新規登録"));
    expect(screen.getByText("給料登録")).toBeInTheDocument();
  });

  // CT-SL-006: バリデーションエラー表示
  it("手取り額0で送信するとエラー", async () => {
    const user = userEvent.setup();
    render(<SalaryList salaries={mockSalaries} />);
    await user.click(screen.getByText("+ 新規登録"));
    // 手取り額に0を入力して送信
    const amountInput = screen.getByPlaceholderText("250000");
    await user.type(amountInput, "0");
    await user.click(screen.getByText("登録する"));
    expect(await screen.findByText("1円以上で入力してください")).toBeInTheDocument();
  });
});

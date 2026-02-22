"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { formatCurrencyJP } from "@/lib/utils";
import { createBulkPayments } from "@/lib/actions/payment";
import type { CreditCard, Category } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AllocationRow = {
  id: string;
  categoryId: string;
  amount: number | undefined;
  memo: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditCards: CreditCard[];
  categories: Category[];
  currentMonth: string;
};

export function BulkAllocationDialog({
  open,
  onOpenChange,
  creditCards,
  categories,
  currentMonth,
}: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creditCardId, setCreditCardId] = useState("");
  const [month, setMonth] = useState(currentMonth);
  const [totalAmount, setTotalAmount] = useState<number | undefined>();
  const [rows, setRows] = useState<AllocationRow[]>([
    { id: crypto.randomUUID(), categoryId: "", amount: undefined, memo: "" },
  ]);

  const allocated = rows.reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const remaining = (totalAmount ?? 0) - allocated;

  function handleReset() {
    setCreditCardId("");
    setMonth(currentMonth);
    setTotalAmount(undefined);
    setRows([{ id: crypto.randomUUID(), categoryId: "", amount: undefined, memo: "" }]);
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { id: crypto.randomUUID(), categoryId: "", amount: undefined, memo: "" },
    ]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRow(id: string, field: keyof AllocationRow, value: string | number | undefined) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  async function handleSubmit() {
    if (!creditCardId) {
      toast.error("クレジットカードを選択してください");
      return;
    }
    const validRows = rows.filter((r) => r.amount && r.amount > 0);
    if (validRows.length === 0) {
      toast.error("1件以上の振り分けを入力してください");
      return;
    }

    setIsSubmitting(true);
    const result = await createBulkPayments(
      validRows.map((r) => ({
        creditCardId,
        categoryId: r.categoryId || undefined,
        month,
        amount: r.amount!,
        memo: r.memo || undefined,
        isRecurring: false,
      }))
    );
    setIsSubmitting(false);

    if (result.success) {
      toast(`${validRows.length}件を一括登録しました`);
      handleReset();
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isSubmitting) onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>合計から振り分け</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* カード選択 */}
          <div className="space-y-1">
            <Label>クレジットカード *</Label>
            {creditCards.length === 0 ? (
              <p className="text-sm text-muted-foreground border-2 border-dashed border-border rounded-md px-3 py-2">
                先にカードを登録してください
              </p>
            ) : (
              <Select value={creditCardId} onValueChange={setCreditCardId}>
                <SelectTrigger className="border-2 border-border bg-white">
                  <SelectValue placeholder="カードを選択" />
                </SelectTrigger>
                <SelectContent className="border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  {creditCards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 月 */}
          <div className="space-y-1">
            <Label>対象月 *</Label>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border-2 border-border bg-white"
            />
          </div>

          {/* 明細合計金額 */}
          <div className="space-y-1">
            <Label>明細合計金額（円）</Label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="150000"
              value={totalAmount != null ? String(totalAmount) : ""}
              onChange={(e) => {
                const digits = e.target.value.replace(/[^0-9]/g, "");
                setTotalAmount(digits === "" ? undefined : Number(digits));
              }}
              className="border-2 border-border bg-white"
            />
            {totalAmount != null && (
              <p className="text-xs font-bold text-foreground">
                = {formatCurrencyJP(totalAmount)}
              </p>
            )}
          </div>

          {/* 振り分け行 */}
          <div className="space-y-2">
            <Label>カテゴリ振り分け</Label>
            {rows.map((row, idx) => (
              <div key={row.id} className="flex items-center gap-2">
                {/* カテゴリ */}
                <Select
                  value={row.categoryId}
                  onValueChange={(v) => updateRow(row.id, "categoryId", v)}
                >
                  <SelectTrigger className="w-[140px] shrink-0 border-2 border-border bg-white text-sm">
                    <SelectValue placeholder="カテゴリ" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full border border-border"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 金額 */}
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="金額"
                  value={row.amount != null ? String(row.amount) : ""}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^0-9]/g, "");
                    updateRow(row.id, "amount", digits === "" ? undefined : Number(digits));
                  }}
                  className="w-[100px] shrink-0 border-2 border-border bg-white text-sm"
                />

                {/* メモ */}
                <Input
                  type="text"
                  placeholder="メモ（任意）"
                  value={row.memo}
                  onChange={(e) => updateRow(row.id, "memo", e.target.value)}
                  className="min-w-0 flex-1 border-2 border-border bg-white text-sm"
                />

                {/* 削除ボタン */}
                {rows.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeRow(row.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addRow()}
              className="w-full border-dashed"
            >
              <Plus className="mr-1 h-4 w-4" />
              行を追加
            </Button>
          </div>

          {/* 残額表示 */}
          {totalAmount != null && (
            <div
              className={`rounded border-2 px-3 py-2 text-sm font-bold ${
                remaining === 0
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : remaining < 0
                  ? "border-red-400 bg-red-50 text-red-700"
                  : "border-border bg-muted"
              }`}
            >
              残額: {formatCurrencyJP(remaining)}
              {remaining === 0 && " （全額振り分け済み）"}
              {remaining < 0 && " （合計を超過しています）"}
            </div>
          )}

          {/* ボタン */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              disabled={isSubmitting || creditCards.length === 0}
              onClick={() => handleSubmit()}
            >
              一括登録する
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

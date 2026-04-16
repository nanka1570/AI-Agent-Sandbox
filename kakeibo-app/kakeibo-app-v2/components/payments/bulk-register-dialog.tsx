"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bulkRegisterPayments } from "@/lib/actions/payment-actions";
import { createCategory } from "@/lib/actions/category-actions";
import { formatCurrency } from "@/lib/utils/format";
import { LAST_DAY_CODE } from "@/lib/constants";
import { addMonthsToMonth } from "@/lib/utils/date";

interface CreditCardWithDates {
  id: string;
  name: string;
  closingDay: number;
  paymentDay: number;
  paymentMonthOffset: number;
  confirmationDay: number | null;
  confirmationMonthOffset: number | null;
}

interface BulkRegisterDialogProps {
  creditCards: CreditCardWithDates[];
  categories: Array<{ id: string; name: string; color: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDay(day: number): string {
  return day === LAST_DAY_CODE ? "末日" : `${day}日`;
}

function formatMonthOffset(offset: number): string {
  switch (offset) {
    case 0: return "当月";
    case 1: return "翌月";
    case 2: return "翌々月";
    default: return `+${offset}ヶ月`;
  }
}

function formatMonthOffsetLabel(offset: number): string {
  switch (offset) {
    case 0: return "利用月";
    case 1: return "利用月の翌月";
    case 2: return "利用月の翌々月";
    default: return `利用月の+${offset}ヶ月後`;
  }
}

/** 振り分け行の型 */
interface AllocationItem {
  id: string;
  categoryId: string | null;
  amount: number;
}

/** 一意IDつきの新規振り分け行を生成 */
function createAllocationItem(): AllocationItem {
  return { id: crypto.randomUUID(), categoryId: null, amount: 0 };
}

/**
 * 一括登録ダイアログ（2ステップ）
 * STEP1: カード選択、利用月入力、合計額入力
 * STEP2: カテゴリ別振り分け
 */
export function BulkRegisterDialog({
  creditCards,
  categories,
  open,
  onOpenChange,
}: BulkRegisterDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STEP1 の入力値
  const [creditCardId, setCreditCardId] = useState("");
  const [month, setMonth] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);

  // STEP2 の振り分けデータ
  const [items, setItems] = useState<AllocationItem[]>([
    createAllocationItem(),
  ]);

  // STEP2 で追加したカテゴリ（サーバーから取得済みのものと合わせて表示）
  const [localCategories, setLocalCategories] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);
  const allCategories = [...categories, ...localCategories];

  // 新規カテゴリ追加フォームの表示状態
  const [showNewCatForm, setShowNewCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#6366f1");
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  /** 振り分け合計額 */
  const itemsTotal = items.reduce((sum, item) => sum + item.amount, 0);

  /** 振り分け合計が合計額と一致するか */
  const isTotalMatched = itemsTotal === totalAmount;

  /** ダイアログを閉じるときにリセット */
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep(1);
      setCreditCardId("");
      setMonth("");
      setTotalAmount(0);
      setItems([createAllocationItem()]);
      setLocalCategories([]);
      setShowNewCatForm(false);
      setNewCatName("");
      setNewCatColor("#6366f1");
    }
    onOpenChange(newOpen);
  };

  /** STEP1 → STEP2 への遷移 */
  const handleNext = () => {
    if (!creditCardId || !month || totalAmount < 1) return;
    setStep(2);
  };

  /** STEP2 → STEP1 への戻り */
  const handleBack = () => {
    setStep(1);
  };

  /** 振り分け行を追加 */
  const addItem = () => {
    setItems([...items, createAllocationItem()]);
  };

  /** 振り分け行を削除 */
  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  /** 振り分け行のカテゴリを変更 */
  const updateCategoryId = (index: number, value: string | null) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], categoryId: value };
    setItems(newItems);
  };

  /** 振り分け行の金額を変更 */
  const updateAmount = (index: number, value: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], amount: value };
    setItems(newItems);
  };

  /** 新規カテゴリを作成してローカルリストに追加 */
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setIsCreatingCat(true);
    try {
      const result = await createCategory({ name: newCatName.trim(), color: newCatColor });
      if (result.success && result.data) {
        const cat = result.data;
        setLocalCategories((prev) => [
          ...prev,
          { id: cat.id, name: cat.name, color: cat.color },
        ]);
        setNewCatName("");
        setNewCatColor("#6366f1");
        setShowNewCatForm(false);
        toast.success(`カテゴリ「${cat.name}」を追加しました`);
      } else if (!result.success) {
        toast.error(result.error ?? "カテゴリの作成に失敗しました");
      }
    } catch {
      toast.error("通信エラーが発生しました");
    } finally {
      setIsCreatingCat(false);
    }
  };

  /** 一括登録を実行 */
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const result = await bulkRegisterPayments({
        creditCardId,
        month,
        totalAmount,
        items,
      });

      if (result.success) {
        toast.success("一括登録が完了しました");
        handleOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("通信エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            一括登録 - {step === 1 ? "STEP1: 基本情報" : "STEP2: カテゴリ振り分け"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          /* STEP1: カード選択、利用月入力、合計額入力 */
          <div className="space-y-4">
            {/* カード選択 */}
            <div className="space-y-2">
              <Label>カード</Label>
              <Select value={creditCardId} onValueChange={setCreditCardId}>
                <SelectTrigger>
                  <SelectValue placeholder="カードを選択" />
                </SelectTrigger>
                <SelectContent>
                  {creditCards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 利用月 */}
            <div className="space-y-2">
              <Label htmlFor="bulk-month">利用月</Label>
              <Input
                id="bulk-month"
                type="month"
                className="cursor-pointer"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch {} }}
              />
            </div>

            {/* カード・利用月選択後に締め日/確定日/支払日を表示 */}
            {creditCardId && month && (() => {
              const card = creditCards.find((c) => c.id === creditCardId);
              if (!card) return null;
              return (
                <div className="rounded-md bg-muted p-3 text-xs space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>締め日</span>
                    <span>{Number(month.split("-")[1])}月 {formatDay(card.closingDay)}</span>
                  </div>
                  {card.confirmationDay != null && card.confirmationMonthOffset != null && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>確定日</span>
                      <span>
                        {Number(addMonthsToMonth(month, card.confirmationMonthOffset).split("-")[1])}月
                        {formatDay(card.confirmationDay)}
                        <span className="text-muted-foreground/60 ml-1">
                          （{formatMonthOffsetLabel(card.confirmationMonthOffset)}）
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>支払日</span>
                    <span>
                      {Number(addMonthsToMonth(month, card.paymentMonthOffset).split("-")[1])}月
                      {formatDay(card.paymentDay)}
                      <span className="text-muted-foreground/60 ml-1">
                        （{formatMonthOffsetLabel(card.paymentMonthOffset)}）
                      </span>
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* 支払合計額 */}
            <div className="space-y-2">
              <Label htmlFor="bulk-total">支払合計額</Label>
              <Input
                id="bulk-total"
                type="number"
                min={1}
                placeholder="0"
                value={totalAmount || ""}
                onChange={(e) => setTotalAmount(Number(e.target.value) || 0)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                キャンセル
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                disabled={!creditCardId || !month || totalAmount < 1}
              >
                次へ
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* STEP2: カテゴリ別振り分け */
          <div className="space-y-4">
            {/* 合計額の表示 */}
            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span>支払合計額:</span>
                <span className="font-medium">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>振り分け済み:</span>
                <span
                  className={`font-medium ${
                    isTotalMatched
                      ? "text-sage-success"
                      : "text-destructive"
                  }`}
                >
                  {formatCurrency(itemsTotal)}
                </span>
              </div>
              {!isTotalMatched && (
                <div className="flex justify-between mt-1">
                  <span>残り:</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(totalAmount - itemsTotal)}
                  </span>
                </div>
              )}
            </div>

            {/* 振り分け行 */}
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="flex items-end gap-2">
                  {/* カテゴリ選択 */}
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">カテゴリ</Label>
                    <Select
                      value={item.categoryId ?? "__none__"}
                      onValueChange={(val) =>
                        updateCategoryId(index, val === "__none__" ? null : val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="カテゴリを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">未分類</SelectItem>
                        {allCategories.map((cat) => (
                          <SelectItem
                            key={cat.id}
                            value={cat.id}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className="inline-block size-3 rounded-full"
                                style={{ backgroundColor: cat.color }}
                              />
                              {cat.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 金額入力 */}
                  <div className="w-28 space-y-1">
                    <Label className="text-xs">金額</Label>
                    <Input
                      type="number"
                      min={0}
                      value={item.amount || ""}
                      onChange={(e) =>
                        updateAmount(index, Number(e.target.value) || 0)
                      }
                    />
                  </div>

                  {/* 削除ボタン（1行の場合は無効） */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={items.length <= 1}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            {/* 行追加ボタン */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="w-full"
            >
              <Plus className="size-4" />
              行を追加
            </Button>

            {/* 新規カテゴリ追加 */}
            {showNewCatForm ? (
              <div className="rounded-md border p-3 space-y-2">
                <p className="text-xs font-medium">新規カテゴリを追加</p>
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">カテゴリ名</Label>
                    <Input
                      type="text"
                      placeholder="例: 食費"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreateCategory(); } }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">カラー</Label>
                    <input
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded-md border border-input bg-transparent p-1"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => { setShowNewCatForm(false); setNewCatName(""); setNewCatColor("#6366f1"); }}
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateCategory}
                    disabled={!newCatName.trim() || isCreatingCat}
                  >
                    {isCreatingCat ? "追加中..." : "追加"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowNewCatForm(true)}
                className="w-full text-muted-foreground"
              >
                <Plus className="size-4" />
                新規カテゴリを追加
              </Button>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleBack}>
                戻る
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={itemsTotal < 1 || isSubmitting}
              >
                {isSubmitting ? "登録中..." : "一括登録"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

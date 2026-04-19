"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertBudget } from "@/lib/actions/budget-actions";
import { formatCurrency } from "@/lib/utils/format";

interface BudgetItem {
  id: string;
  categoryId: string;
  month: string;
  amount: number;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface BudgetSettingsProps {
  categories: Category[];
  budgets: BudgetItem[];
  selectedMonth: string;
}

export function BudgetSettings({
  categories,
  budgets,
  selectedMonth,
}: BudgetSettingsProps) {
  const [amounts, setAmounts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    budgets.forEach((b) => {
      initial[b.categoryId] = String(b.amount);
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    const targets = categories.flatMap((cat) => {
      const amount = parseInt(amounts[cat.id] ?? "", 10);
      if (!amount || amount <= 0) return [];
      return [{ cat, amount }];
    });

    const results = await Promise.allSettled(
      targets.map(({ cat, amount }) =>
        upsertBudget({
          categoryId: cat.id,
          month: selectedMonth,
          amount,
        }),
      ),
    );

    const failedNames = results.flatMap((result, i) => {
      if (result.status === "rejected" || !result.value.success) {
        return [targets[i].cat.name];
      }
      return [];
    });

    if (failedNames.length > 0) {
      toast.error(`保存に失敗したカテゴリ: ${failedNames.join("、")}`);
    } else {
      toast.success("予算を保存しました");
    }
    setSaving(false);
  };

  const totalBudget = Object.values(amounts).reduce(
    (sum, v) => sum + (Number(v) || 0),
    0,
  );

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{selectedMonth} の予算</p>
        <span className="text-xs text-muted-foreground">
          合計: {formatCurrency(totalBudget)}
        </span>
      </div>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-3">
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: cat.color }}
            />
            <span className="min-w-[100px] truncate text-sm">{cat.name}</span>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={amounts[cat.id] ?? ""}
              onChange={(e) =>
                setAmounts((prev) => ({ ...prev, [cat.id]: e.target.value }))
              }
              className="w-[140px] text-right"
            />
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        <Save className="size-4" />
        {saving ? "保存中..." : "予算を保存"}
      </Button>
    </div>
  );
}

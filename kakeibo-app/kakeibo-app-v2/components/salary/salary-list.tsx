"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { SalaryForm } from "@/components/salary/salary-form";
import { deleteSalary } from "@/lib/actions/salary-actions";
import { formatCurrency, formatMonth, formatDay } from "@/lib/utils/format";

interface SalaryItem {
  id: string;
  month: string;
  payDay: number;
  amount: number;
  memo: string | null;
  sortOrder: number;
}

interface SalaryListProps {
  salaries: SalaryItem[];
  recentAmounts: number[];
}

export function SalaryList({ salaries, recentAmounts }: SalaryListProps) {
  const [items, setItems] = useState(salaries);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<SalaryItem | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<SalaryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /** 新規追加ダイアログを開く */
  const handleAdd = () => {
    setEditingSalary(undefined);
    setFormOpen(true);
  };

  /** 編集ダイアログを開く */
  const handleEdit = (salary: SalaryItem) => {
    setEditingSalary(salary);
    setFormOpen(true);
  };

  /** 削除確認ダイアログを開く */
  const handleDeleteConfirm = (salary: SalaryItem) => {
    setDeleteTarget(salary);
  };

  /** 削除を実行する */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    const result = await deleteSalary(deleteTarget.id);
    if (result.success) {
      toast.success("手取りを削除しました");
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    } else {
      toast.error(result.error ?? "削除に失敗しました");
    }

    setIsDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      {/* 新規追加ボタン */}
      <Button onClick={handleAdd} className="w-full sm:w-auto">
        <Plus className="size-4" />
        手取りを登録
      </Button>

      {/* データがない場合 */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-foreground/40 p-8 text-center">
          <Wallet className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            手取りがまだ登録されていません
          </p>
        </div>
      )}

      {/* 手取り一覧（月降順） */}
      <div className="space-y-2">
        {items.map((salary) => (
          <Card key={salary.id}>
            <CardContent className="flex items-center gap-3 p-4">
              {/* 月表示 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {formatMonth(salary.month)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    支給日: {formatDay(salary.payDay)}
                  </span>
                </div>
                <p className="text-lg font-bold mt-1">
                  {formatCurrency(salary.amount)}
                </p>
                {salary.memo && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {salary.memo}
                  </p>
                )}
              </div>

              {/* 編集ボタン */}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleEdit(salary)}
                aria-label={`${formatMonth(salary.month)}の手取りを編集`}
              >
                <Pencil className="size-4" />
              </Button>

              {/* 削除ボタン */}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDeleteConfirm(salary)}
                aria-label={`${formatMonth(salary.month)}の手取りを削除`}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 追加・編集フォームダイアログ */}
      <SalaryForm
        key={editingSalary?.id ?? "new"}
        salary={editingSalary}
        recentAmounts={recentAmounts}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={(data, isEditing) => {
          if (isEditing) {
            setItems((prev) =>
              prev.map((i) => (i.id === data.id ? data : i))
            );
          } else {
            setItems((prev) =>
              [...prev, data].sort((a, b) => b.sortOrder - a.sortOrder)
            );
          }
        }}
      />

      {/* 削除確認ダイアログ */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>手取りを削除</DialogTitle>
            <DialogDescription>
              {deleteTarget && formatMonth(deleteTarget.month)}
              の手取りを削除しますか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "削除中..." : "削除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

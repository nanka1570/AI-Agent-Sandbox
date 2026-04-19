"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SalaryForm, type SalaryItem } from "@/components/salary/salary-form";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { deleteSalary } from "@/lib/actions/salary-actions";
import { formatCurrency, formatDay, formatMonth } from "@/lib/utils/format";

interface SalaryListProps {
  salaries: SalaryItem[];
}

export function SalaryList({ salaries: initial }: SalaryListProps) {
  const [items, setItems] = useState(initial);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SalaryItem | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<SalaryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <Button
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          手取りを登録
        </Button>
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
          <Wallet className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            手取りがまだ登録されていません
          </p>
        </div>
        <SalaryForm
          key="new"
          open={formOpen}
          onOpenChange={setFormOpen}
          onSuccess={(data) => setItems([data])}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={() => {
          setEditing(undefined);
          setFormOpen(true);
        }}
      >
        <Plus className="size-4" />
        手取りを登録
      </Button>

      <div className="space-y-2">
        {items.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-3 rounded-lg border bg-card p-3"
          >
            <div className="flex-1">
              <p className="text-sm font-medium">
                {formatMonth(s.month)} / 支給日: {formatDay(s.payDay)}
              </p>
              <p className="text-lg font-bold">{formatCurrency(s.amount)}</p>
              {s.memo && (
                <p className="text-xs text-muted-foreground">{s.memo}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setEditing(s);
                setFormOpen(true);
              }}
              aria-label="編集"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDeleteTarget(s)}
              aria-label="削除"
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <SalaryForm
        key={editing?.id ?? "new"}
        salary={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={(data, isEditing) => {
          if (isEditing) {
            setItems((prev) =>
              prev.map((i) => (i.id === data.id ? data : i)),
            );
          } else {
            setItems((prev) => [...prev, data]);
          }
        }}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="手取りを削除"
        description={`${deleteTarget ? formatMonth(deleteTarget.month) : ""}の手取りを削除しますか？`}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}

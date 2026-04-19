"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, Landmark } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AccountForm,
  type AccountItem,
} from "@/components/accounts/account-form";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { deleteAccount } from "@/lib/actions/account-actions";
import { formatCurrency } from "@/lib/utils/format";
import { ACCOUNT_TYPE_LABELS, type AccountType } from "@/lib/constants";

interface AccountListProps {
  accounts: AccountItem[];
}

export function AccountList({ accounts: initial }: AccountListProps) {
  const [items, setItems] = useState(initial);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AccountItem | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<AccountItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteAccount(deleteTarget.id);
    if (result.success) {
      toast.success("口座を削除しました");
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    } else {
      toast.error(result.error ?? "削除に失敗しました");
    }
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const total = items.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          口座を登録
        </Button>
        {items.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">合計残高</p>
            <p className="text-xl font-bold">{formatCurrency(total)}</p>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
          <Landmark className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            口座がまだ登録されていません
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {a.name}{" "}
                  <span className="text-xs text-muted-foreground">
                    ({ACCOUNT_TYPE_LABELS[a.type as AccountType]})
                  </span>
                </p>
                <p className="text-lg font-bold">{formatCurrency(a.balance)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setEditing(a);
                  setFormOpen(true);
                }}
                aria-label="編集"
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDeleteTarget(a)}
                aria-label="削除"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <AccountForm
        key={editing?.id ?? "new"}
        account={editing}
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
        title="口座を削除"
        description={`「${deleteTarget?.name}」を削除しますか？関連する支払い・カード設定から口座参照が外されます。`}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Pencil,
  Trash2,
  Plus,
  CreditCard as CreditCardIcon,
  Scale,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  CreditCardForm,
  type CreditCardItem,
} from "@/components/credit-cards/credit-card-form";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { deleteCreditCard } from "@/lib/actions/credit-card-actions";
import { formatDay } from "@/lib/utils/format";
import { CARD_BRANDS } from "@/lib/constants";

interface AccountOption {
  id: string;
  name: string;
}

interface CreditCardListProps {
  cards: CreditCardItem[];
  accounts: AccountOption[];
}

export function CreditCardList({
  cards: initial,
  accounts,
}: CreditCardListProps) {
  const [items, setItems] = useState(initial);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CreditCardItem | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<CreditCardItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteCreditCard(deleteTarget.id);
    if (result.success) {
      toast.success("カードを削除しました");
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    } else {
      toast.error(result.error ?? "削除に失敗しました");
    }
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const getBrandLabel = (brand: string | null) => {
    if (!brand) return null;
    return CARD_BRANDS.find((b) => b.value === brand)?.label ?? brand;
  };

  const getAccountName = (accountId: string | null) => {
    if (!accountId) return null;
    return accounts.find((a) => a.id === accountId)?.name ?? null;
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={() => {
          setEditing(undefined);
          setFormOpen(true);
        }}
      >
        <Plus className="size-4" />
        カードを登録
      </Button>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
          <CreditCardIcon className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            カードがまだ登録されていません
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((c) => {
            const brandLabel = getBrandLabel(c.brand);
            const accountName = getAccountName(c.accountId);
            return (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    {c.name}
                    {brandLabel && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {brandLabel}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    締め {formatDay(c.closingDay)} / 支払 {formatDay(c.paymentDay)}（
                    {c.paymentMonthOffset === 0
                      ? "当月"
                      : c.paymentMonthOffset === 1
                        ? "翌月"
                        : "翌々月"}
                    ）
                  </p>
                  {accountName && (
                    <p className="text-xs text-muted-foreground">
                      引落先: {accountName}
                    </p>
                  )}
                </div>
                <Link href={`/credit-cards/${c.id}/reconcile`}>
                  <Button variant="ghost" size="icon-sm" aria-label="照合">
                    <Scale className="size-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setEditing(c);
                    setFormOpen(true);
                  }}
                  aria-label="編集"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleteTarget(c)}
                  aria-label="削除"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <CreditCardForm
        key={editing?.id ?? "new"}
        card={editing}
        accounts={accounts}
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
        title="カードを削除"
        description={`「${deleteTarget?.name}」を削除しますか？関連する支払いからカード参照が外されます。`}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}

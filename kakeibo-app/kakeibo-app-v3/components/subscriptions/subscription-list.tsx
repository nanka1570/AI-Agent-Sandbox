"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus, Repeat, CreditCard, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  SubscriptionForm,
  type SubscriptionItem,
} from "@/components/subscriptions/subscription-form";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { deleteSubscription } from "@/lib/actions/subscription-actions";
import { formatCurrency } from "@/lib/utils/format";

interface EnrichedSubscription extends SubscriptionItem {
  categoryName: string;
  categoryColor: string;
  cardName: string | null;
  accountName: string | null;
}

interface CardOption {
  id: string;
  name: string;
}
interface AccountOption {
  id: string;
  name: string;
}
interface CategoryOption {
  id: string;
  name: string;
  color: string;
}

interface SubscriptionListProps {
  subscriptions: EnrichedSubscription[];
  cards: CardOption[];
  accounts: AccountOption[];
  categories: CategoryOption[];
}

export function SubscriptionList({
  subscriptions: initial,
  cards,
  accounts,
  categories,
}: SubscriptionListProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EnrichedSubscription | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<EnrichedSubscription | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteSubscription(deleteTarget.id);
    if (result.success) {
      toast.success("定期支払を削除しました");
      router.refresh();
    } else {
      toast.error(result.error ?? "削除に失敗しました");
    }
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const monthlyTotal = initial.reduce((s, x) => s + x.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
          disabled={cards.length === 0 && accounts.length === 0}
        >
          <Plus className="size-4" />
          定期支払を登録
        </Button>
        {initial.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">月額合計</p>
            <p className="text-xl font-bold">{formatCurrency(monthlyTotal)}</p>
          </div>
        )}
      </div>

      {cards.length === 0 && accounts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          先に「クレジットカード」または「口座」を登録してください。
        </div>
      ) : initial.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
          <Repeat className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            定期支払がまだ登録されていません
          </p>
          <p className="text-xs text-muted-foreground">
            Netflix・家賃・分割ローンなど、毎月同額で発生する支払いを 1 件登録するだけで、毎月の支払いに自動反映されます。
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {initial.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: s.categoryColor }}
                  />
                  <p className="text-sm font-medium">{s.name}</p>
                  <span className="text-[11px] text-muted-foreground">
                    {s.categoryName}
                  </span>
                  <span className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {s.source === "card" ? (
                      <CreditCard className="size-3" />
                    ) : (
                      <Wallet className="size-3" />
                    )}
                    {s.source === "card"
                      ? (s.cardName ?? "カード")
                      : (s.accountName ?? "口座")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  毎月{s.dayOfMonth}日 / {s.startMonth} 〜{" "}
                  {s.endMonth ?? "無期限"}
                  {s.installmentTotal && (
                    <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-900 dark:bg-sky-900/40 dark:text-sky-200">
                      全{s.installmentTotal}回
                    </span>
                  )}
                  {s.memo && <span className="ml-2">{s.memo}</span>}
                </p>
              </div>
              <p className="font-bold">{formatCurrency(s.amount)}</p>
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
      )}

      <SubscriptionForm
        key={editing?.id ?? "new"}
        subscription={editing}
        cards={cards}
        accounts={accounts}
        categories={categories}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => router.refresh()}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="定期支払を削除"
        description={`「${deleteTarget?.name}」を削除しますか？ダッシュボード・カレンダーから仮想的な支払いも消えます。`}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}

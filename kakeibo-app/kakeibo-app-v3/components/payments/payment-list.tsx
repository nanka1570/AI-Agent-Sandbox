"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  Plus,
  Upload,
  Receipt,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PaymentForm,
  type PaymentItem,
} from "@/components/payments/payment-form";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { deletePayment } from "@/lib/actions/payment-actions";
import { formatCurrency } from "@/lib/utils/format";
import { PAYMENT_STATUSES, type PaymentStatus } from "@/lib/constants";

interface CardOption {
  id: string;
  name: string;
}
interface CategoryOption {
  id: string;
  name: string;
  color: string;
}

interface EnrichedPayment extends PaymentItem {
  cardName: string | null;
  categoryName: string;
  categoryColor: string;
}

interface PaymentListProps {
  payments: EnrichedPayment[];
  cards: CardOption[];
  categories: CategoryOption[];
}

export function PaymentList({
  payments: initial,
  cards,
  categories,
}: PaymentListProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EnrichedPayment | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<EnrichedPayment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapsed = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const grouped = useMemo(() => {
    const buckets = new Map<string | null, EnrichedPayment[]>();
    for (const p of initial) {
      const key = p.creditCardId ?? null;
      const arr = buckets.get(key);
      if (arr) arr.push(p);
      else buckets.set(key, [p]);
    }
    const order: (string | null)[] = cards.map((c) => c.id);
    if (buckets.has(null)) order.push(null);
    return order
      .filter((k) => buckets.has(k))
      .map((key) => {
        const items = buckets.get(key) ?? [];
        const name =
          key === null
            ? "カード未設定"
            : (cards.find((c) => c.id === key)?.name ?? "カード未設定");
        const total = items.reduce((s, p) => s + p.amount, 0);
        return { key, name, items, total };
      });
  }, [initial, cards]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deletePayment(deleteTarget.id);
    if (result.success) {
      toast.success("支払いを削除しました");
      router.refresh();
    } else {
      toast.error(result.error ?? "削除に失敗しました");
    }
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
          disabled={cards.length === 0}
        >
          <Plus className="size-4" />
          支払いを登録
        </Button>
        <Link href="/payments/import">
          <Button variant="outline" disabled={cards.length === 0}>
            <Upload className="size-4" />
            CSV 取り込み
          </Button>
        </Link>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          先に「クレジットカード」を登録してください。
        </div>
      ) : initial.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
          <Receipt className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            支払いがまだ登録されていません
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => {
            const groupKey = g.key ?? "__none";
            const isOpen = !collapsed.has(groupKey);
            return (
            <section key={groupKey} className="space-y-2">
              <button
                type="button"
                onClick={() => toggleCollapsed(groupKey)}
                className="flex w-full items-center gap-3 rounded-md bg-muted/60 px-3 py-2 transition-colors hover:bg-muted"
                aria-expanded={isOpen}
              >
                <ChevronDown
                  className={`size-4 text-muted-foreground transition-transform ${
                    isOpen ? "" : "-rotate-90"
                  }`}
                />
                <CreditCard className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-bold">{g.name}</h2>
                <span className="text-xs text-muted-foreground">
                  {g.items.length} 件
                </span>
                <span className="ml-auto text-base font-bold">
                  {formatCurrency(g.total)}
                </span>
              </button>
              {isOpen && (
              <div className="space-y-2">
                {g.items.map((p) => {
                  const status =
                    PAYMENT_STATUSES[p.status as PaymentStatus] ??
                    PAYMENT_STATUSES.unconfirmed;
                  const dateStr =
                    typeof p.usageDate === "string"
                      ? p.usageDate.slice(0, 10)
                      : format(p.usageDate, "yyyy-MM-dd");
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-lg border bg-card p-3"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: p.categoryColor }}
                          />
                          <p className="text-sm font-medium">
                            {p.categoryName}
                          </p>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {dateStr}
                          {p.memo && <span className="ml-2">{p.memo}</span>}
                        </p>
                      </div>
                      <p className="font-bold">{formatCurrency(p.amount)}</p>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditing(p);
                          setFormOpen(true);
                        }}
                        aria-label="編集"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(p)}
                        aria-label="削除"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
              )}
            </section>
            );
          })}
        </div>
      )}

      <PaymentForm
        key={editing?.id ?? "new"}
        payment={editing}
        cards={cards}
        categories={categories}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => router.refresh()}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="支払いを削除"
        description={`${formatCurrency(deleteTarget?.amount ?? 0)} の支払いを削除しますか？`}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

    </div>
  );
}
